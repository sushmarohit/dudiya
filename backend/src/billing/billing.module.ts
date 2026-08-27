import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  CustomerBillingController,
  DistributorBillingController,
} from './billing.controller';

@Module({
  controllers: [DistributorBillingController, CustomerBillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
