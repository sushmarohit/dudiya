import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { ProductsService } from './products.service';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, CatalogService],
  exports: [ProductsService, CatalogService],
})
export class ProductsModule {}
