import { Module } from '@nestjs/common';
import { DistributorController } from './distributor.controller';
import { DistributorService } from './distributor.service';
import { ReadinessService } from './readiness.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [DistributorController],
  providers: [DistributorService, ReadinessService],
  exports: [ReadinessService],
})
export class DistributorModule {}
