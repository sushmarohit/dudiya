import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { DistributorModule } from '../distributor/distributor.module';
import { ProductsModule } from '../products/products.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [DistributorModule, ProductsModule, IdentityModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
