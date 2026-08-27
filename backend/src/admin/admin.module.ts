import { Module } from '@nestjs/common';
import { DeliveryModule } from '../delivery/delivery.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OperationsService } from './operations.service';
import {
  AdminDeliveryItemController,
  AdminOperationsController,
} from './operations.controller';

@Module({
  imports: [DeliveryModule],
  controllers: [
    AdminController,
    AdminOperationsController,
    AdminDeliveryItemController,
  ],
  providers: [AdminService, OperationsService],
})
export class AdminModule {}
