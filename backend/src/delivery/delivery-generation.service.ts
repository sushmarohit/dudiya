import { Injectable } from '@nestjs/common';
import {
  DeliveryItemStatus,
  DeliveryRunStatus,
  RequestStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionScheduleService } from '../subscription/subscription-schedule.service';
import { startOfDay, toDateKey } from '../common/utils/date.util';

@Injectable()
export class DeliveryGenerationService {
  constructor(
    private prisma: PrismaService,
    private schedule: SubscriptionScheduleService,
  ) {}

  async generateForDistributor(
    distributorId: string,
    deliveryDate: Date,
    slotId?: string,
  ) {
    const day = startOfDay(deliveryDate);

    const unavailable = await this.prisma.distributorUnavailableDay.findUnique({
      where: {
        distributorId_date: { distributorId, date: day },
      },
    });
    if (unavailable) {
      return { generated: 0, items: [], skippedReason: 'distributor_unavailable' };
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        distributorId,
        status: SubscriptionStatus.ACTIVE,
        ...(slotId ? { deliverySlotId: slotId } : {}),
      },
      include: {
        pauses: { where: { status: RequestStatus.APPROVED } },
        extras: { where: { status: RequestStatus.APPROVED } },
        deliverySlot: true,
      },
    });

    const slotsToProcess = slotId
      ? subscriptions.filter((s) => s.deliverySlotId === slotId)
      : subscriptions;

    const slotIds = [...new Set(slotsToProcess.map((s) => s.deliverySlotId))];

    const results: Awaited<ReturnType<typeof this.prisma.deliveryItem.upsert>>[] = [];
    for (const slot of slotIds) {
      const slotSubs = subscriptions.filter((s) => s.deliverySlotId === slot);
      const delivery = await this.ensureDeliveryHeader(distributorId, day, slot);
      let order = 0;

      for (const sub of slotSubs) {
        const dates = this.schedule.getDeliveryDates(
          sub.frequency,
          sub.startDate,
          day,
          day,
        );
        if (!dates.length) continue;

        const pausedDates = this.schedule.expandPausedDatesInRange(
          sub.pauses.map((p) => ({ startDate: p.startDate, endDate: p.endDate })),
          day,
          day,
        );
        const isPaused = pausedDates.includes(toDateKey(day));

        const extraQty = sub.extras
          .filter((e) => toDateKey(e.date) === toDateKey(day))
          .reduce((sum, e) => sum + e.extraQuantity, 0);

        let plannedQty = isPaused ? 0 : sub.quantity + extraQty;
        if (plannedQty <= 0) continue;

        order += 1;
        const item = await this.prisma.deliveryItem.upsert({
          where: {
            subscriptionId_productId_deliveryDate: {
              subscriptionId: sub.id,
              productId: sub.productId,
              deliveryDate: day,
            },
          },
          create: {
            deliveryId: delivery.id,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            productId: sub.productId,
            deliveryDate: day,
            plannedQty,
            status: DeliveryItemStatus.PENDING,
            routeOrder: order,
          },
          update: {
            plannedQty,
            routeOrder: order,
          },
        });
        results.push(item);
      }

      await this.prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryRunStatus.GENERATED, generatedAt: new Date() },
      });
    }

    return { generated: results.length, items: results };
  }

  async generateForAllDistributors(deliveryDate: Date) {
    const distributors = await this.prisma.distributorProfile.findMany({
      where: { setupStatus: 'GO_LIVE', identityVerified: true },
      select: { id: true },
    });
    let total = 0;
    for (const d of distributors) {
      const result = await this.generateForDistributor(d.id, deliveryDate);
      total += result.generated;
    }
    return { distributors: distributors.length, itemsGenerated: total };
  }

  private async ensureDeliveryHeader(
    distributorId: string,
    deliveryDate: Date,
    slotId: string,
  ) {
    return this.prisma.delivery.upsert({
      where: {
        distributorId_deliveryDate_slotId: {
          distributorId,
          deliveryDate,
          slotId,
        },
      },
      create: {
        distributorId,
        deliveryDate,
        slotId,
        status: DeliveryRunStatus.GENERATED,
      },
      update: {},
    });
  }
}
