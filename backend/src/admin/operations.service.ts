import { Injectable } from '@nestjs/common';
import {
  BillAdjustmentType,
  DeliveryItemStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decimalToNumber } from '../common/utils/money.util';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async getDeliveryStats(from?: string, to?: string) {
    const dateFilter =
      from && to
        ? {
            deliveryDate: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {};

    const items = await this.prisma.deliveryItem.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { id: true },
    });

    const total = items.reduce((sum, i) => sum + i._count.id, 0);
    const delivered =
      items.find((i) => i.status === DeliveryItemStatus.DELIVERED)?._count.id ?? 0;

    return {
      total,
      byStatus: items.map((i) => ({
        status: i.status,
        count: i._count.id,
      })),
      successRate: total > 0 ? delivered / total : 0,
    };
  }

  async getBillingStats() {
    const bills = await this.prisma.bill.findMany({
      where: {
        status: { not: 'VOID' },
      },
      select: { total: true, amountPaid: true, status: true },
    });

    let billed = 0;
    let collected = 0;
    for (const b of bills) {
      billed += decimalToNumber(b.total);
      collected += decimalToNumber(b.amountPaid);
    }

    return {
      billed,
      collected,
      outstanding: billed - collected,
      billCount: bills.length,
    };
  }

  async getExceptions() {
    const failedDeliveries = await this.prisma.deliveryItem.findMany({
      where: {
        status: { in: [DeliveryItemStatus.FAILED, DeliveryItemStatus.SKIPPED] },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { include: { user: { select: { name: true } } } },
        product: true,
        delivery: { include: { distributor: { select: { businessName: true } } } },
      },
    });

    const negativeAdjustments = await this.prisma.billAdjustment.findMany({
      where: { type: BillAdjustmentType.CREDIT },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        bill: {
          include: {
            customer: { include: { user: { select: { name: true } } } },
            distributor: { select: { businessName: true } },
          },
        },
      },
    });

    return { failedDeliveries, adjustments: negativeAdjustments };
  }
}
