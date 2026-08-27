import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common';
import { SubscriptionScheduleService } from './subscription-schedule.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionEndService } from './subscription-end.service';
import { BillingModule } from '../billing/billing.module';

@Global()
@Module({
  imports: [BillingModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionScheduleService, SubscriptionEndService],
  exports: [SubscriptionScheduleService, SubscriptionEndService],
})
export class SubscriptionModule {}
