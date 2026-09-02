import { Module } from '@nestjs/common';
import { DistributorController } from './distributor.controller';
import { DistributorService } from './distributor.service';
import { ReadinessService } from './readiness.service';
import { ProductsModule } from '../products/products.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [ProductsModule, IdentityModule],
  controllers: [DistributorController],
  providers: [DistributorService, ReadinessService],
  exports: [ReadinessService],
})
export class DistributorModule {}
