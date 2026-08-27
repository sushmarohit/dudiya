import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BillAdjustmentType,
  BillStatus,
  BillingCycle,
  DeliveryItemStatus,
  NotificationType,
  PaymentMethod,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../notification/notification.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import {
  decimalToNumber,
  formatMoney,
  sumDecimals,
  toDecimal,
} from '../common/utils/money.util';
import { parseDateInput, startOfDay } from '../common/utils/date.util';
import { UpdateBillingSettingsDto } from './dto/billing-settings.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { BillAdjustmentDto } from './dto/bill-adjustment.dto';
import { VoidBillDto } from './dto/void-bill.dto';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationService,
  ) {}

  private async getDistributorProfile(userId: string) {
    const profile = await this.prisma.distributorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throwApi(ApiErrorCode.DISTRIBUTOR_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  private async getCustomerProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) {
      throwApi(ApiErrorCode.CUSTOMER_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  getCycleWindow(
    cycle: BillingCycle,
    reference: Date,
    biWeeklyAnchorDay?: number | null,
  ): { cycleStart: Date; cycleEnd: Date } {
    const ref = startOfDay(reference);
    if (cycle === BillingCycle.MONTHLY) {
      const cycleEnd = new Date(ref.getFullYear(), ref.getMonth(), 0);
      cycleEnd.setHours(23, 59, 59, 999);
      const cycleStart = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), 1);
      return { cycleStart, cycleEnd };
    }

    if (cycle === BillingCycle.BI_WEEKLY) {
      const anchor = biWeeklyAnchorDay ?? 0;
      const day = ref.getDay();
      const diff = (day - anchor + 7) % 7;
      const cycleEnd = new Date(ref);
      cycleEnd.setDate(cycleEnd.getDate() - diff);
      cycleEnd.setHours(23, 59, 59, 999);
      const cycleStart = new Date(cycleEnd);
      cycleStart.setDate(cycleStart.getDate() - 13);
      cycleStart.setHours(0, 0, 0, 0);
      return { cycleStart, cycleEnd };
    }

    // Weekly — close on Sunday; cycle Mon–Sun of previous week when run on Monday
    const day = ref.getDay();
    const daysFromSunday = day === 0 ? 0 : day;
    const cycleEnd = new Date(ref);
    cycleEnd.setDate(cycleEnd.getDate() - daysFromSunday);
    cycleEnd.setHours(23, 59, 59, 999);
    const cycleStart = new Date(cycleEnd);
    cycleStart.setDate(cycleStart.getDate() - 6);
    cycleStart.setHours(0, 0, 0, 0);
    return { cycleStart, cycleEnd };
  }

  async getSettings(userId: string) {
    const profile = await this.getDistributorProfile(userId);
    return {
      billingCycle: profile.billingCycle,
      biWeeklyAnchorDay: profile.biWeeklyAnchorDay,
      billingDueDays: profile.billingDueDays,
      timezone: profile.timezone,
    };
  }

  async updateSettings(userId: string, dto: UpdateBillingSettingsDto) {
    const profile = await this.getDistributorProfile(userId);
    return this.prisma.distributorProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.billingCycle ? { billingCycle: dto.billingCycle } : {}),
        ...(dto.biWeeklyAnchorDay !== undefined
          ? { biWeeklyAnchorDay: dto.biWeeklyAnchorDay }
          : {}),
        ...(dto.billingDueDays !== undefined
          ? { billingDueDays: dto.billingDueDays }
          : {}),
        ...(dto.timezone ? { timezone: dto.timezone } : {}),
      },
    });
  }

  private async resolveUnitPrice(
    distributorId: string,
    productId: string,
    fatPercent: number | null,
    deliveryDate: Date,
  ): Promise<Decimal> {
    const pricing = await this.prisma.pricing.findFirst({
      where: {
        distributorId,
        productId,
        active: true,
        effectiveFrom: { lte: deliveryDate },
        ...(fatPercent != null ? { fatPercent } : {}),
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!pricing) {
      throwApi(ApiErrorCode.NO_ACTIVE_PRICING, HttpStatus.BAD_REQUEST);
    }
    return toDecimal(pricing.pricePerUnit);
  }

  async runCycle(userId: string, referenceDate?: string) {
    const profile = await this.getDistributorProfile(userId);
    const ref = referenceDate ? parseDateInput(referenceDate) : new Date();
    const { cycleStart, cycleEnd } = this.getCycleWindow(
      profile.billingCycle,
      ref,
      profile.biWeeklyAnchorDay,
    );

    const items = await this.prisma.deliveryItem.findMany({
      where: {
        status: DeliveryItemStatus.DELIVERED,
        deliveryDate: { gte: cycleStart, lte: cycleEnd },
        delivery: { distributorId: profile.id },
        billLineItems: { none: {} },
      },
      include: {
        subscription: true,
        product: true,
        customer: { include: { user: true } },
      },
    });

    const byCustomer = new Map<string, typeof items>();
    for (const item of items) {
      const list = byCustomer.get(item.customerId) ?? [];
      list.push(item);
      byCustomer.set(item.customerId, list);
    }

    const bills: Awaited<ReturnType<typeof this.prisma.bill.create>>[] = [];
    for (const [customerId, customerItems] of byCustomer) {
      const lineData: Array<{
        item: (typeof items)[0];
        unitPrice: Decimal;
        qty: number;
        lineTotal: Decimal;
      }> = [];
      for (const item of customerItems) {
        const unitPrice = await this.resolveUnitPrice(
          profile.id,
          item.productId,
          item.subscription.fatPercent,
          item.deliveryDate,
        );
        const qty = item.deliveredQty ?? item.plannedQty;
        const lineTotal = unitPrice.mul(qty);
        lineData.push({ item, unitPrice, qty, lineTotal });
      }

      const subtotal = sumDecimals(lineData.map((l) => l.lineTotal));
      const adjustments = new Decimal(0);
      const total = subtotal.add(adjustments);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + profile.billingDueDays);

      const bill = await this.prisma.bill.create({
        data: {
          distributorId: profile.id,
          customerId,
          cycleStart,
          cycleEnd,
          subtotal,
          adjustments,
          total,
          amountPaid: new Decimal(0),
          status: BillStatus.ISSUED,
          dueDate,
          issuedAt: new Date(),
          lineItems: {
            create: lineData.map((l) => ({
              productId: l.item.productId,
              deliveryDate: l.item.deliveryDate,
              quantity: l.qty,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
              deliveryItemId: l.item.id,
            })),
          },
        },
        include: { lineItems: true },
      });

      const customerUser = customerItems[0].customer.user;
      await this.notifications.create({
        userId: customerUser.id,
        type: NotificationType.BILL_GENERATED,
        title: 'New bill issued',
        body: `Your bill for ${cycleStart.toISOString().split('T')[0]} – ${cycleEnd.toISOString().split('T')[0]} is ₹${formatMoney(total)}.`,
        payload: { billId: bill.id },
        eventId: `bill-generated:${bill.id}`,
      });

      bills.push(bill);
    }

    await this.audit.log(userId, 'BILLING_CYCLE_RUN', 'distributor_profile', profile.id, {
      cycleStart,
      cycleEnd,
      billsCreated: bills.length,
    });

    return { cycleStart, cycleEnd, billsCreated: bills.length, bills };
  }

  async runCycleForAllDistributors(referenceDate?: Date) {
    const distributors = await this.prisma.distributorProfile.findMany({
      where: { setupStatus: 'GO_LIVE', identityVerified: true },
      select: { userId: true },
    });
    let total = 0;
    for (const d of distributors) {
      const result = await this.runCycle(d.userId, referenceDate?.toISOString());
      total += result.billsCreated;
    }
    return { distributors: distributors.length, billsCreated: total };
  }

  async listBills(
    userId: string,
    filters: {
      customerId?: string;
      status?: BillStatus;
    },
  ) {
    const profile = await this.getDistributorProfile(userId);
    return this.prisma.bill.findMany({
      where: {
        distributorId: profile.id,
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: {
        customer: { include: { user: { select: { name: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBill(userId: string, billId: string) {
    const profile = await this.getDistributorProfile(userId);
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, distributorId: profile.id },
      include: {
        lineItems: { include: { product: true } },
        payments: true,
        billAdjustments: true,
        customer: { include: { user: true } },
      },
    });
    if (!bill) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return bill;
  }

  async recordPayment(userId: string, billId: string, dto: RecordPaymentDto) {
    const profile = await this.getDistributorProfile(userId);
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, distributorId: profile.id },
      include: { customer: { include: { user: true } } },
    });
    if (!bill) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (bill.status === BillStatus.VOID || bill.status === BillStatus.DRAFT) {
      throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
    }

    const amount = toDecimal(dto.amount);
    const newPaid = bill.amountPaid.add(amount);
    const total = bill.total;

    let status: BillStatus = bill.status;
    if (newPaid.gte(total)) {
      status = BillStatus.PAID;
    } else if (newPaid.gt(0)) {
      status = BillStatus.PARTIALLY_PAID;
    }

    const payment = await this.prisma.payment.create({
      data: {
        billId,
        amount,
        method: dto.method,
        reference: dto.reference,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        recordedBy: userId,
      },
    });

    await this.prisma.bill.update({
      where: { id: billId },
      data: { amountPaid: newPaid, status },
    });

    await this.notifications.create({
      userId: bill.customer.user.id,
      type: NotificationType.PAYMENT_RECORDED,
      title: 'Payment recorded',
      body: `Payment of ₹${formatMoney(amount)} recorded on your bill.`,
      payload: { billId, paymentId: payment.id },
      eventId: `payment-recorded:${payment.id}`,
    });

    await this.audit.log(userId, 'PAYMENT_RECORDED', 'bill', billId, {
      amount: dto.amount,
      method: dto.method,
    });

    return payment;
  }

  async addAdjustment(userId: string, billId: string, dto: BillAdjustmentDto) {
    const profile = await this.getDistributorProfile(userId);
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, distributorId: profile.id },
    });
    if (!bill) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const amount = toDecimal(dto.amount);
    const adj = await this.prisma.billAdjustment.create({
      data: {
        billId,
        type: dto.type,
        amount,
        reason: dto.reason,
        createdBy: userId,
      },
    });

    const delta =
      dto.type === BillAdjustmentType.CREDIT ? amount.neg() : amount;
    const adjustments = bill.adjustments.add(delta);
    const total = bill.subtotal.add(adjustments);

    await this.prisma.bill.update({
      where: { id: billId },
      data: { adjustments, total },
    });

    await this.audit.log(userId, 'BILL_ADJUSTMENT', 'bill', billId, {
      type: dto.type,
      amount: dto.amount,
      reason: dto.reason,
    });
    return adj;
  }

  async voidBill(userId: string, billId: string, dto: VoidBillDto) {
    const profile = await this.getDistributorProfile(userId);
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, distributorId: profile.id },
    });
    if (!bill) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (bill.status === BillStatus.PAID) {
      throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
    }

    return this.prisma.bill.update({
      where: { id: billId },
      data: { status: BillStatus.VOID, voidReason: dto.reason },
    });
  }

  async getDues(userId: string) {
    const profile = await this.getDistributorProfile(userId);
    const bills = await this.prisma.bill.findMany({
      where: {
        distributorId: profile.id,
        status: {
          in: [
            BillStatus.ISSUED,
            BillStatus.PARTIALLY_PAID,
            BillStatus.OVERDUE,
          ],
        },
      },
      include: {
        customer: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    const byCustomer = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        phone: string | null;
        outstanding: number;
        oldestDue: Date | null;
      }
    >();

    for (const bill of bills) {
      const outstanding = decimalToNumber(bill.total.sub(bill.amountPaid));
      if (outstanding <= 0) continue;
      const existing = byCustomer.get(bill.customerId);
      const dueDate = bill.dueDate;
      if (!existing) {
        byCustomer.set(bill.customerId, {
          customerId: bill.customerId,
          customerName: bill.customer.user.name,
          phone: bill.customer.user.phone,
          outstanding,
          oldestDue: dueDate,
        });
      } else {
        existing.outstanding += outstanding;
        if (dueDate && (!existing.oldestDue || dueDate < existing.oldestDue)) {
          existing.oldestDue = dueDate;
        }
      }
    }

    return Array.from(byCustomer.values());
  }

  async listCustomerBills(userId: string) {
    const profile = await this.getCustomerProfile(userId);
    return this.prisma.bill.findMany({
      where: { customerId: profile.id },
      include: {
        distributor: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomerBill(userId: string, billId: string) {
    const profile = await this.getCustomerProfile(userId);
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, customerId: profile.id },
      include: {
        lineItems: { include: { product: true } },
        payments: true,
        billAdjustments: true,
        distributor: { select: { businessName: true } },
      },
    });
    if (!bill) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return bill;
  }

  async generateBillPdf(billId: string, forUserId: string, role: 'distributor' | 'customer') {
    let bill;
    if (role === 'distributor') {
      bill = await this.getBill(forUserId, billId);
    } else {
      bill = await this.getCustomerBill(forUserId, billId);
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Bill ID: ${bill.id}`);
    doc.text(`Period: ${bill.cycleStart.toISOString().split('T')[0]} – ${bill.cycleEnd.toISOString().split('T')[0]}`);
    doc.text(`Status: ${bill.status}`);
    doc.text(`Total: ₹${formatMoney(bill.total)}`);
    doc.text(`Paid: ₹${formatMoney(bill.amountPaid)}`);
    doc.moveDown();
    doc.text('Line items:');
    for (const line of bill.lineItems) {
      doc.text(
        `${line.deliveryDate.toISOString().split('T')[0]} | ${line.product?.name ?? line.productId} | ${line.quantity} x ₹${formatMoney(line.unitPrice)} = ₹${formatMoney(line.lineTotal)}`,
      );
    }

    doc.end();
    await new Promise<void>((resolve) => doc.on('end', resolve));
    return Buffer.concat(chunks);
  }

  async markOverdueBills() {
    const now = new Date();
    const result = await this.prisma.bill.updateMany({
      where: {
        status: { in: [BillStatus.ISSUED, BillStatus.PARTIALLY_PAID] },
        dueDate: { lt: now },
      },
      data: { status: BillStatus.OVERDUE },
    });
    return { updated: result.count };
  }
}
