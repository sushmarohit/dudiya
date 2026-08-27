import { Global, Module } from '@nestjs/common';
import { SubscriptionScheduleService } from './subscription-schedule.service';
import { SubscriptionController } from './subscription.controller';

@Global()
@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionScheduleService],
  exports: [SubscriptionScheduleService],
})
export class SubscriptionModule {}
