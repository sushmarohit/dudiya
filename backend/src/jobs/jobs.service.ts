import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { DeliveryGenerationService } from '../delivery/delivery-generation.service';
import { BillingService } from '../billing/billing.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay } from '../common/utils/date.util';
import { isBillingEnabled } from '../common/config/feature-flags';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private deliveryGeneration: DeliveryGenerationService,
    private billing: BillingService,
    private notifications: NotificationService,
    private prisma: PrismaService,
  ) {}

  @Cron('30 0 * * *')
  async generateDailyDeliveries() {
    this.logger.log('Running generate_daily_deliveries');
    const today = startOfDay(new Date());
    const result = await this.deliveryGeneration.generateForAllDistributors(today);
    this.logger.log(`Generated ${result.itemsGenerated} items for ${result.distributors} distributors`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async closeBillingCycles() {
    if (!isBillingEnabled()) {
      this.logger.debug('Billing disabled — skipping close_billing_cycles');
      return;
    }
    this.logger.log('Running close_billing_cycles');
    const result = await this.billing.runCycleForAllDistributors(new Date());
    this.logger.log(`Created ${result.billsCreated} bills`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async markOverdueBills() {
    if (!isBillingEnabled()) {
      this.logger.debug('Billing disabled — skipping mark_overdue_bills');
      return;
    }
    this.logger.log('Running mark_overdue_bills');
    const result = await this.billing.markOverdueBills();
    this.logger.log(`Marked ${result.updated} bills overdue`);
  }

  @Cron('0 7 * * *')
  async deliveryReminderNotifications() {
    this.logger.log('Running delivery_reminder_notifications');
    const today = startOfDay(new Date());
    const distributors = await this.prisma.distributorProfile.findMany({
      where: { setupStatus: 'GO_LIVE', identityVerified: true },
      include: { user: true },
    });

    for (const d of distributors) {
      const count = await this.prisma.deliveryItem.count({
        where: {
          deliveryDate: today,
          delivery: { distributorId: d.id },
        },
      });
      if (count === 0) continue;

      await this.notifications.create({
        userId: d.userId,
        type: NotificationType.DELIVERY_REMINDER,
        title: 'Today\'s delivery list',
        body: `You have ${count} deliveries scheduled for today.`,
        payload: { date: today.toISOString().split('T')[0], count },
        eventId: `delivery-reminder:${d.id}:${today.toISOString().split('T')[0]}`,
      });
    }
  }
}
