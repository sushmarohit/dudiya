import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DeliveryItemStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { NotificationService } from '../notification/notification.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { parseDateInput, startOfDay, formatDateKey } from '../common/utils/date.util';
import { DeliveryGenerationService } from './delivery-generation.service';
import { UpdateDeliveryItemDto } from './dto/update-delivery-item.dto';
import { BulkDeliveryStatusDto } from './dto/bulk-delivery-status.dto';
import { ReorderDeliveryItemsDto } from './dto/reorder-delivery-items.dto';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private generation: DeliveryGenerationService,
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
    });
    if (!profile) {
      throwApi(ApiErrorCode.CUSTOMER_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  async generate(userId: string, date: string, slotId?: string) {
    const profile = await this.getDistributorProfile(userId);
    const deliveryDate = parseDateInput(date);
    return this.generation.generateForDistributor(
      profile.id,
      deliveryDate,
      slotId,
    );
  }

  async listForDistributor(
    userId: string,
    opts: {
      date?: string;
      month?: string;
      from?: string;
      to?: string;
      slotId?: string;
      customerId?: string;
    },
  ) {
    const profile = await this.getDistributorProfile(userId);
    const { fromDate, toDate } = this.resolveDeliveryDateRange(opts);

    const items = await this.prisma.deliveryItem.findMany({
      where: {
        deliveryDate: { gte: fromDate, lte: toDate },
        ...(opts.customerId ? { customerId: opts.customerId } : {}),
        delivery: {
          distributorId: profile.id,
          ...(opts.slotId ? { slotId: opts.slotId } : {}),
        },
      },
      include: {
        customer: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
        product: true,
        subscription: { include: { deliverySlot: true } },
      },
      orderBy: [
        { deliveryDate: 'asc' },
        { routeOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    return items;
  }

  private resolveDeliveryDateRange(opts: {
    date?: string;
    month?: string;
    from?: string;
    to?: string;
  }): { fromDate: Date; toDate: Date } {
    if (opts.date) {
      const day = parseDateInput(opts.date);
      return { fromDate: day, toDate: day };
    }

    if (opts.month) {
      const match = /^(\d{4})-(\d{2})$/.exec(opts.month);
      if (!match) {
        throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
      }
      const year = Number(match![1]);
      const monthNum = Number(match![2]);
      if (monthNum < 1 || monthNum > 12) {
        throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
      }
      const fromDate = new Date(year, monthNum - 1, 1);
      const toDate = new Date(year, monthNum, 0);
      return { fromDate: startOfDay(fromDate), toDate: startOfDay(toDate) };
    }

    if (opts.from && opts.to) {
      return {
        fromDate: parseDateInput(opts.from),
        toDate: parseDateInput(opts.to),
      };
    }

    throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateDeliveryItemDto,
    actorRole: UserRole,
  ) {
    const profile = await this.getDistributorProfile(userId);
    const item = await this.prisma.deliveryItem.findFirst({
      where: {
        id: itemId,
        delivery: { distributorId: profile.id },
      },
      include: {
        customer: { include: { user: true } },
        product: true,
      },
    });
    if (!item) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (
      item.status === DeliveryItemStatus.DELIVERED &&
      dto.status &&
      dto.status !== DeliveryItemStatus.DELIVERED &&
      actorRole !== UserRole.ADMIN
    ) {
      throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    if (
      (dto.status === DeliveryItemStatus.SKIPPED ||
        dto.status === DeliveryItemStatus.FAILED) &&
      !dto.notes
    ) {
      throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
    }

    const deliveredQty =
      dto.status === DeliveryItemStatus.DELIVERED
        ? dto.deliveredQty ?? item.plannedQty
        : dto.deliveredQty ?? item.deliveredQty;

    const updated = await this.prisma.deliveryItem.update({
      where: { id: itemId },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(deliveredQty !== undefined ? { deliveredQty } : {}),
        ...(dto.status === DeliveryItemStatus.DELIVERED
          ? { deliveredAt: new Date() }
          : {}),
      },
    });

    await this.audit.log(userId, 'DELIVERY_ITEM_UPDATED', 'delivery_item', itemId, {
      status: dto.status,
      deliveredQty,
    });

    if (
      dto.status === DeliveryItemStatus.SKIPPED ||
      dto.status === DeliveryItemStatus.FAILED
    ) {
      await this.notifications.create({
        userId: item.customer.user.id,
        type: NotificationType.DELIVERY_FAILED_SKIPPED,
        title: 'Delivery update',
        body: `Your ${item.product.name} delivery on ${item.deliveryDate.toISOString().split('T')[0]} was marked ${dto.status.toLowerCase()}.`,
        payload: {
          deliveryItemId: item.id,
          status: dto.status,
        },
        eventId: `delivery-status:${item.id}:${dto.status}`,
      });
    }

    return updated;
  }

  async reorderItems(userId: string, dto: ReorderDeliveryItemsDto) {
    const profile = await this.getDistributorProfile(userId);
    for (const entry of dto.items) {
      await this.prisma.deliveryItem.updateMany({
        where: {
          id: entry.id,
          delivery: { distributorId: profile.id },
        },
        data: { routeOrder: entry.routeOrder },
      });
    }
    return { success: true };
  }

  async bulkStatus(userId: string, dto: BulkDeliveryStatusDto) {
    const profile = await this.getDistributorProfile(userId);
    const deliveryDate = parseDateInput(dto.date);
    const items = await this.prisma.deliveryItem.findMany({
      where: {
        deliveryDate,
        status: DeliveryItemStatus.PENDING,
        delivery: {
          distributorId: profile.id,
          ...(dto.slotId ? { slotId: dto.slotId } : {}),
        },
      },
    });

    for (const item of items) {
      await this.updateItem(
        userId,
        item.id,
        {
          status: dto.status,
          deliveredQty: item.plannedQty,
          notes: dto.notes,
        },
        UserRole.DISTRIBUTOR,
      );
    }
    return { updated: items.length };
  }

  async exportCsv(
    userId: string,
    opts: {
      date?: string;
      month?: string;
      from?: string;
      to?: string;
      slotId?: string;
      customerId?: string;
    },
  ) {
    const items = await this.listForDistributor(userId, opts);
    const header =
      'Date,Order,Customer,Phone,Product,Planned Qty,Delivered Qty,Status,Address';
    const rows = items.map((item) => {
      const address =
        item.customer.formattedAddress || item.customer.addressLine || '';
      const dateKey =
        item.deliveryDate instanceof Date
          ? formatDateKey(item.deliveryDate)
          : String(item.deliveryDate).slice(0, 10);
      return [
        dateKey,
        item.routeOrder ?? '',
        item.customer.user.name,
        item.customer.user.phone ?? '',
        item.product.name,
        item.plannedQty,
        item.deliveredQty ?? '',
        item.status,
        `"${address.replace(/"/g, '""')}"`,
      ].join(',');
    });
    return [header, ...rows].join('\n');
  }

  async listForCustomer(userId: string, from: string, to: string) {
    const profile = await this.getCustomerProfile(userId);
    const fromDate = parseDateInput(from);
    const toDate = parseDateInput(to);
    return this.prisma.deliveryItem.findMany({
      where: {
        customerId: profile.id,
        deliveryDate: { gte: fromDate, lte: toDate },
      },
      include: {
        product: true,
        subscription: { include: { deliverySlot: true } },
      },
      orderBy: { deliveryDate: 'desc' },
    });
  }

  async adminOverrideItem(
    adminUserId: string,
    itemId: string,
    dto: UpdateDeliveryItemDto,
  ) {
    const item = await this.prisma.deliveryItem.findUnique({
      where: { id: itemId },
      include: { delivery: true },
    });
    if (!item) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const distributor = await this.prisma.distributorProfile.findUnique({
      where: { id: item.delivery.distributorId },
    });
    if (!distributor) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.updateItem(
      distributor.userId,
      itemId,
      dto,
      UserRole.ADMIN,
    );
  }
}
