import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Product,
  ProductCategory,
  ProductPromotionStatus,
  ProductScope,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { CreateGlobalProductDto } from './dto/create-global-product.dto';
import { UpdateGlobalProductDto } from './dto/update-global-product.dto';
import { CreateCustomProductDto } from './dto/create-custom-product.dto';
import { UpdateCustomProductDto } from './dto/update-custom-product.dto';

const productSelect = {
  id: true,
  sku: true,
  name: true,
  category: true,
  species: true,
  unit: true,
  active: true,
  scope: true,
  promotionStatus: true,
  ownerDistributorId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  listGlobalProducts(includeInactive = false) {
    return this.prisma.product.findMany({
      where: {
        scope: ProductScope.GLOBAL,
        ...(includeInactive ? {} : { active: true }),
      },
      select: productSelect,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getGlobalProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, scope: ProductScope.GLOBAL },
      select: productSelect,
    });
    if (!product) {
      throwApi(ApiErrorCode.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return product;
  }

  async createGlobalProduct(dto: CreateGlobalProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku.trim().toUpperCase() },
    });
    if (existing) {
      throwApi(ApiErrorCode.PRODUCT_SKU_EXISTS, HttpStatus.CONFLICT);
    }
    return this.prisma.product.create({
      data: {
        sku: dto.sku.trim().toUpperCase(),
        name: dto.name.trim(),
        category: dto.category,
        species: dto.species ?? null,
        unit: dto.unit?.trim() || 'litre',
        active: dto.active ?? true,
        scope: ProductScope.GLOBAL,
        promotionStatus: ProductPromotionStatus.NONE,
      },
      select: productSelect,
    });
  }

  async updateGlobalProduct(id: string, dto: UpdateGlobalProductDto) {
    await this.getGlobalProduct(id);
    if (dto.sku) {
      const sku = dto.sku.trim().toUpperCase();
      const conflict = await this.prisma.product.findFirst({
        where: { sku, NOT: { id } },
      });
      if (conflict) {
        throwApi(ApiErrorCode.PRODUCT_SKU_EXISTS, HttpStatus.CONFLICT);
      }
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.sku ? { sku: dto.sku.trim().toUpperCase() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.species !== undefined ? { species: dto.species } : {}),
        ...(dto.unit ? { unit: dto.unit.trim() } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
      select: productSelect,
    });
  }

  async deactivateGlobalProduct(id: string) {
    await this.getGlobalProduct(id);
    const inUse = await this.prisma.subscription.count({
      where: { productId: id, status: SubscriptionStatus.ACTIVE },
    });
    if (inUse > 0) {
      throwApi(ApiErrorCode.PRODUCT_IN_USE, HttpStatus.BAD_REQUEST);
    }
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
      select: productSelect,
    });
  }

  listDistributorSubmissions() {
    return this.prisma.product.findMany({
      where: {
        scope: ProductScope.DISTRIBUTOR,
        promotionStatus: {
          in: [
            ProductPromotionStatus.PRIVATE,
            ProductPromotionStatus.PENDING_REVIEW,
            ProductPromotionStatus.REJECTED,
          ],
        },
      },
      select: {
        ...productSelect,
        ownerDistributor: {
          select: { id: true, businessName: true, city: true },
        },
      },
      orderBy: [{ promotionStatus: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async promoteProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, scope: ProductScope.DISTRIBUTOR },
    });
    if (!product) {
      throwApi(ApiErrorCode.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    let sku = product.sku;
    if (sku.startsWith('PVT-')) {
      sku = await this.generateGlobalSku(product.name, product.category);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        scope: ProductScope.GLOBAL,
        ownerDistributorId: null,
        promotionStatus: ProductPromotionStatus.PROMOTED,
        sku,
        active: true,
      },
      select: productSelect,
    });
  }

  async rejectPromotion(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, scope: ProductScope.DISTRIBUTOR },
    });
    if (!product) {
      throwApi(ApiErrorCode.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.product.update({
      where: { id },
      data: { promotionStatus: ProductPromotionStatus.REJECTED },
      select: productSelect,
    });
  }

  async keepPrivate(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, scope: ProductScope.DISTRIBUTOR },
    });
    if (!product) {
      throwApi(ApiErrorCode.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.product.update({
      where: { id },
      data: { promotionStatus: ProductPromotionStatus.PRIVATE },
      select: productSelect,
    });
  }

  async createCustomProduct(distributorId: string, dto: CreateCustomProductDto) {
    const sku = `PVT-${distributorId.slice(-8)}-${Date.now()}`;
    const product = await this.prisma.product.create({
      data: {
        sku,
        name: dto.name.trim(),
        category: dto.category,
        species: dto.species ?? null,
        unit: dto.unit?.trim() || 'litre',
        scope: ProductScope.DISTRIBUTOR,
        ownerDistributorId: distributorId,
        promotionStatus: ProductPromotionStatus.PRIVATE,
      },
      select: productSelect,
    });

    await this.prisma.distributorProduct.create({
      data: {
        distributorId,
        productId: product.id,
        enabled: true,
      },
    });

    if (dto.pricePerUnit != null && dto.pricePerUnit >= 0) {
      await this.prisma.pricing.create({
        data: {
          distributorId,
          productId: product.id,
          fatPercent: dto.fatPercent ?? null,
          pricePerUnit: dto.pricePerUnit,
        },
      });
    }

    return product;
  }

  async updateCustomProduct(
    distributorId: string,
    productId: string,
    dto: UpdateCustomProductDto,
  ) {
    await this.assertOwnCustomProduct(distributorId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.species !== undefined ? { species: dto.species } : {}),
        ...(dto.unit ? { unit: dto.unit.trim() } : {}),
      },
      select: productSelect,
    });
  }

  async deactivateCustomProduct(distributorId: string, productId: string) {
    await this.assertOwnCustomProduct(distributorId, productId);
    const inUse = await this.prisma.subscription.count({
      where: {
        productId,
        distributorId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (inUse > 0) {
      throwApi(ApiErrorCode.PRODUCT_IN_USE, HttpStatus.BAD_REQUEST);
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { active: false },
      select: productSelect,
    });
  }

  async requestPromotion(distributorId: string, productId: string) {
    const product = await this.assertOwnCustomProduct(distributorId, productId);
    if (product.promotionStatus === ProductPromotionStatus.PENDING_REVIEW) {
      return product;
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { promotionStatus: ProductPromotionStatus.PENDING_REVIEW },
      select: productSelect,
    });
  }

  async assertDistributorCanUseProduct(
    distributorId: string,
    productId: string,
  ): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.active) {
      throwApi(ApiErrorCode.PRODUCT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
    }
    if (product.scope === ProductScope.DISTRIBUTOR) {
      if (product.ownerDistributorId !== distributorId) {
        throwApi(ApiErrorCode.PRODUCT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
      }
      return product;
    }
    const enabled = await this.prisma.distributorProduct.findFirst({
      where: { distributorId, productId, enabled: true },
    });
    if (!enabled) {
      throwApi(ApiErrorCode.PRODUCT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
    }
    return product;
  }

  private async assertOwnCustomProduct(distributorId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        scope: ProductScope.DISTRIBUTOR,
        ownerDistributorId: distributorId,
        active: true,
      },
      select: productSelect,
    });
    if (!product) {
      throwApi(ApiErrorCode.PRODUCT_FORBIDDEN, HttpStatus.FORBIDDEN);
    }
    return product;
  }

  private async generateGlobalSku(name: string, category: ProductCategory) {
    const base = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    const prefix = category.slice(0, 4);
    let sku = `${prefix}-${base || 'PRODUCT'}`;
    let suffix = 0;
    while (await this.prisma.product.findUnique({ where: { sku } })) {
      suffix += 1;
      sku = `${prefix}-${base || 'PRODUCT'}-${suffix}`;
    }
    return sku;
  }
}
