import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { DeliveryGenerationService } from './delivery-generation.service';
import { DeliveryService } from './delivery.service';
import {
  CustomerDeliveryController,
  DistributorDeliveryController,
  DistributorDeliveryItemController,
} from './delivery.controller';

@Module({
  imports: [SubscriptionModule],
  controllers: [
    DistributorDeliveryController,
    DistributorDeliveryItemController,
    CustomerDeliveryController,
  ],
  providers: [DeliveryGenerationService, DeliveryService],
  exports: [DeliveryGenerationService, DeliveryService],
})
export class DeliveryModule {}
