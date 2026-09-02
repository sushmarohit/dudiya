import { HttpStatus, Injectable } from '@nestjs/common';
import {
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { UpdatePlatformSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getKpis() {
    const [
      totalDistributors,
      totalCustomers,
      activeSubscriptions,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.distributorProfile.count(),
      this.prisma.customerProfile.count(),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.distributorProfile.count({
        where: { identityVerified: false },
      }),
    ]);
    return {
      totalDistributors,
      totalCustomers,
      activeSubscriptions,
      pendingVerifications,
      pendingDistributors: pendingVerifications,
    };
  }

  /** @deprecated Admin approval removed — returns distributors missing identity verification. */
  async getPendingDistributors() {
    return this.prisma.distributorProfile.findMany({
      where: { identityVerified: false },
      include: {
        user: { select: { id: true, email: true, phone: true, name: true, createdAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listDistributors(search?: string) {
    return this.prisma.distributorProfile.findMany({
      where: {
        OR: search
          ? [
              { businessName: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: {
        user: {
          select: { id: true, email: true, phone: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suspendDistributor(id: string, suspend: boolean, actorId: string) {
    const profile = await this.prisma.distributorProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!profile) {
      throwApi(ApiErrorCode.DISTRIBUTOR_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.prisma.user.update({
      where: { id: profile.userId },
      data: {
        status: suspend ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
      },
    });
    await this.audit.log(
      actorId,
      suspend ? 'DISTRIBUTOR_SUSPENDED' : 'DISTRIBUTOR_UNSUSPENDED',
      'distributor_profile',
      id,
    );
    return { id, suspended: suspend };
  }

  async listCustomers() {
    return this.prisma.customerProfile.findMany({
      include: {
        user: { select: { id: true, email: true, phone: true, name: true, status: true } },
        distributorCustomers: {
          include: {
            distributor: { select: { id: true, businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phone: true, name: true, status: true } },
        distributorCustomers: {
          include: { distributor: true },
        },
        subscriptions: {
          include: {
            product: true,
            deliverySlot: true,
            distributor: { select: { id: true, businessName: true } },
          },
        },
      },
    });
    if (!customer) {
      throwApi(ApiErrorCode.CUSTOMER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return customer;
  }

  async listSubscriptions(status?: SubscriptionStatus, distributorId?: string) {
    return this.prisma.subscription.findMany({
      where: {
        status: status ?? undefined,
        distributorId: distributorId ?? undefined,
      },
      include: {
        customer: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        distributor: { select: { id: true, businessName: true } },
        product: true,
        deliverySlot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSettings() {
    return this.prisma.platformSettings.findUniqueOrThrow({ where: { id: 'default' } });
  }

  async updateSettings(dto: UpdatePlatformSettingsDto, actorId: string) {
    const updated = await this.prisma.platformSettings.update({
      where: { id: 'default' },
      data: dto,
    });
    await this.audit.log(actorId, 'PLATFORM_SETTINGS_UPDATED', 'platform_settings', 'default', {
      ...dto,
    });
    return updated;
  }
}
