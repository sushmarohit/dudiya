import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [ScheduleModule.forRoot(), DeliveryModule, BillingModule],
  providers: [JobsService],
})
export class JobsModule {}
