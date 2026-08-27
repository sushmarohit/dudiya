import { Injectable } from '@nestjs/common';
import { ProductScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  listMasterProducts() {
    return this.prisma.product.findMany({
      where: { active: true, scope: ProductScope.GLOBAL },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        species: true,
        unit: true,
        active: true,
        scope: true,
        promotionStatus: true,
      },
    });
  }
}
