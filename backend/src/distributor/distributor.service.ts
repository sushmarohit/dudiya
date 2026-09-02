import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  OnboardedVia,
  SetupStatus,
  SubscriptionStatus,
  NotificationType,
  UserRole,
  UserStatus,
  ProductScope,
  DeliveryItemStatus,
  ApprovalStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import {
  mergeAddressInput,
  toCustomerLocationData,
  toDistributorLocationData,
} from '../common/address/address.util';
import { SubscriptionScheduleService } from '../subscription/subscription-schedule.service';
import { SubscriptionEndService } from '../subscription/subscription-end.service';
import { ReadinessService } from './readiness.service';
import { PhoneValidationService } from '../common/services/phone-validation.service';
import { NotificationService } from '../notification/notification.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { assertSubscriptionFlowEnabled } from '../common/config/feature-flags';
import { formatDateKey, parseDateInput } from '../common/utils/date.util';
import { UpdateDistributorProfileDto } from './dto/update-profile.dto';
import { SetupStep } from './dto/complete-setup-step.dto';
import { CreatePricingDto, UpdatePricingDto } from './dto/pricing.dto';
import {
  CreateDeliverySlotDto,
  UpdateDeliverySlotDto,
} from './dto/delivery-slot.dto';
import {
  CreateDistributorCustomerDto,
  UpdateDistributorCustomerDto,
} from './dto/customer.dto';
import {
  CreateDistributorSubscriptionDto,
  UpdateDistributorSubscriptionDto,
} from './dto/subscription.dto';
import { CatalogService } from '../products/catalog.service';
import { CreateCustomProductDto } from '../products/dto/create-custom-product.dto';
import { UpdateCustomProductDto } from '../products/dto/update-custom-product.dto';
import { IdentityService } from '../identity/identity.service';

@Injectable()
export class DistributorService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
    private readiness: ReadinessService,
    private schedule: SubscriptionScheduleService,
    private config: ConfigService,
    private phoneValidation: PhoneValidationService,
    private notifications: NotificationService,
    private catalog: CatalogService,
    private subscriptionEnd: SubscriptionEndService,
    private identity: IdentityService,
  ) {}

  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.distributorProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, phone: true, name: true, status: true } } },
    });
    if (!profile) {
      throwApi(ApiErrorCode.DISTRIBUTOR_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  async getProfile(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const readiness = await this.readiness.checkReadiness(profile.id);
    return { ...profile, readiness };
  }

  async updateProfile(userId: string, dto: UpdateDistributorProfileDto) {
    const profile = await this.getProfileByUserId(userId);
    const merged = mergeAddressInput(
      {
        ...profile,
        lat: dto.lat ?? profile.serviceLat ?? undefined,
        lng: dto.lng ?? profile.serviceLng ?? undefined,
      },
      dto,
    );
    const resolved = await this.geocoding.resolveAddress(merged);
    const locationData = toDistributorLocationData(resolved);

    return this.prisma.distributorProfile.update({
      where: { id: profile.id },
      data: {
        businessName: dto.businessName,
        ownerName: dto.ownerName,
        serviceRadiusKm: dto.serviceRadiusKm,
        ...locationData,
      },
    });
  }

  async completeSetupStep(userId: string, step: SetupStep) {
    if (step === 'identity_documents') {
      await this.identity.assertDistributorIdentityForGoLive(userId);
    }
    const profile = await this.getProfileByUserId(userId);
    const steps = new Set(profile.setupSteps);
    steps.add(step);
    return this.prisma.distributorProfile.update({
      where: { id: profile.id },
      data: { setupSteps: Array.from(steps) },
    });
  }

  async goLive(userId: string) {
    await this.identity.assertDistributorIdentityForGoLive(userId);
    const profile = await this.getProfileByUserId(userId);
    await this.readiness.assertGoLiveEligible(profile.id);
    return this.prisma.distributorProfile.update({
      where: { id: profile.id },
      data: {
        // Admin approval removed — keep legacy rows discoverable
        approvalStatus: ApprovalStatus.APPROVED,
        rejectionReason: null,
        identityVerified: true,
        setupStatus: SetupStatus.GO_LIVE,
        goLiveAt: new Date(),
        setupSteps: [
          'business_profile',
          'identity_documents',
          'products',
          'pricing',
          'delivery_slots',
          'readiness',
        ],
      },
    });
  }

  async getProducts(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    const globalProducts = await this.prisma.product.findMany({
      where: { active: true, scope: ProductScope.GLOBAL },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    const customProducts = await this.prisma.product.findMany({
      where: {
        active: true,
        scope: ProductScope.DISTRIBUTOR,
        ownerDistributorId: profile.id,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    const enabled = await this.prisma.distributorProduct.findMany({
      where: { distributorId: profile.id },
    });
    const enabledMap = new Map(enabled.map((e) => [e.productId, e.enabled]));

    const mapProduct = (p: (typeof globalProducts)[0], isCustom: boolean) => ({
      ...p,
      enabled: isCustom ? true : (enabledMap.get(p.id) ?? false),
      isCustom,
    });

    return [
      ...globalProducts.map((p) => mapProduct(p, false)),
      ...customProducts.map((p) => mapProduct(p, true)),
    ];
  }

  async updateProducts(userId: string, productIds: string[], enabled: boolean) {
    const profile = await this.getProfileByUserId(userId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    for (const product of products) {
      if (product.scope !== ProductScope.GLOBAL) {
        throwApi(ApiErrorCode.PRODUCT_FORBIDDEN, HttpStatus.BAD_REQUEST);
      }
    }
    for (const productId of productIds) {
      await this.prisma.distributorProduct.upsert({
        where: {
          distributorId_productId: { distributorId: profile.id, productId },
        },
        create: { distributorId: profile.id, productId, enabled },
        update: { enabled },
      });
    }
    return this.getProducts(userId);
  }

  async createCustomProduct(userId: string, dto: CreateCustomProductDto) {
    const profile = await this.getProfileByUserId(userId);
    return this.catalog.createCustomProduct(profile.id, dto);
  }

  async updateCustomProduct(
    userId: string,
    productId: string,
    dto: UpdateCustomProductDto,
  ) {
    const profile = await this.getProfileByUserId(userId);
    return this.catalog.updateCustomProduct(profile.id, productId, dto);
  }

  async deactivateCustomProduct(userId: string, productId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.catalog.deactivateCustomProduct(profile.id, productId);
  }

  async requestCustomProductPromotion(userId: string, productId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.catalog.requestPromotion(profile.id, productId);
  }

  async listPricing(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.pricing.findMany({
      where: { distributorId: profile.id },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPricing(userId: string, dto: CreatePricingDto) {
    const profile = await this.getProfileByUserId(userId);
    await this.catalog.assertDistributorCanUseProduct(profile.id, dto.productId);
    const duplicate = await this.prisma.pricing.findFirst({
      where: {
        distributorId: profile.id,
        productId: dto.productId,
        fatPercent: dto.fatPercent ?? null,
        active: true,
      },
    });
    if (duplicate) {
      throwApi(ApiErrorCode.PRICING_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }
    return this.prisma.pricing.create({
      data: {
        distributorId: profile.id,
        productId: dto.productId,
        fatPercent: dto.fatPercent,
        pricePerUnit: dto.pricePerUnit,
      },
      include: { product: true },
    });
  }

  async updatePricing(userId: string, pricingId: string, dto: UpdatePricingDto) {
    const profile = await this.getProfileByUserId(userId);
    const pricing = await this.prisma.pricing.findFirst({
      where: { id: pricingId, distributorId: profile.id },
    });
    if (!pricing) {
      throwApi(ApiErrorCode.PRICING_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.pricing.update({
      where: { id: pricingId },
      data: dto,
      include: { product: true },
    });
  }

  async listDeliverySlots(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.deliverySlot.findMany({
      where: { distributorId: profile.id },
      orderBy: { startTime: 'asc' },
    });
  }

  async createDeliverySlot(userId: string, dto: CreateDeliverySlotDto) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.deliverySlot.create({
      data: {
        distributorId: profile.id,
        label: dto.label,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async updateDeliverySlot(
    userId: string,
    slotId: string,
    dto: UpdateDeliverySlotDto,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const slot = await this.prisma.deliverySlot.findFirst({
      where: { id: slotId, distributorId: profile.id },
    });
    if (!slot) {
      throwApi(ApiErrorCode.DELIVERY_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.deliverySlot.update({
      where: { id: slotId },
      data: dto,
    });
  }

  async deleteDeliverySlot(userId: string, slotId: string) {
    const profile = await this.getProfileByUserId(userId);
    const slot = await this.prisma.deliverySlot.findFirst({
      where: { id: slotId, distributorId: profile.id },
    });
    if (!slot) {
      throwApi(ApiErrorCode.DELIVERY_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.deliverySlot.update({
      where: { id: slotId },
      data: { active: false },
    });
  }

  async listCustomers(userId: string, search?: string) {
    const profile = await this.getProfileByUserId(userId);
    const links = await this.prisma.distributorCustomer.findMany({
      where: {
        distributorId: profile.id,
        customer: search
          ? {
              OR: [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : undefined,
      },
      include: {
        customer: {
          include: {
            user: { select: { id: true, email: true, phone: true, name: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => ({
      ...l.customer,
      onboardedVia: l.onboardedVia,
      linkedAt: l.createdAt,
    }));
  }

  async createCustomer(userId: string, dto: CreateDistributorCustomerDto) {
    const profile = await this.getProfileByUserId(userId);
    const resolved = await this.geocoding.resolveAddress(dto);
    const locationData = toCustomerLocationData(resolved);
    const email =
      dto.email ?? `customer+${Date.now()}@invite.milk.local`;
    const tempPassword = randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throwApi(ApiErrorCode.EMAIL_ALREADY_REGISTERED, HttpStatus.CONFLICT);
    }

    const phone = this.phoneValidation.normalize(dto.phone);
    await this.phoneValidation.assertUniqueForRole(phone, UserRole.CUSTOMER);

    const customerUser = await this.prisma.user.create({
      data: {
        email,
        phone,
        name: dto.name,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.PENDING,
        customerProfile: {
          create: locationData,
        },
      },
      include: { customerProfile: true },
    });

    await this.prisma.distributorCustomer.create({
      data: {
        distributorId: profile.id,
        customerId: customerUser.customerProfile!.id,
        onboardedVia: OnboardedVia.DISTRIBUTOR_LED,
      },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.activationToken.create({
      data: { token, userId: customerUser.id, expiresAt },
    });

    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    const activationUrl = `${frontendUrl}/activate?token=${token}`;
    console.log(`[dev] Customer activation link: ${activationUrl}`);

    return {
      customer: {
        id: customerUser.customerProfile!.id,
        user: {
          id: customerUser.id,
          email: customerUser.email,
          phone: customerUser.phone,
          name: customerUser.name,
          status: customerUser.status,
        },
        formattedAddress: resolved.formattedAddress,
        city: resolved.city,
        pincode: resolved.pincode,
        deliveryLat: resolved.lat,
        deliveryLng: resolved.lng,
      },
      activationToken: token,
      activationUrl,
    };
  }

  async getCustomer(userId: string, customerId: string) {
    const profile = await this.getProfileByUserId(userId);
    const link = await this.prisma.distributorCustomer.findUnique({
      where: {
        distributorId_customerId: {
          distributorId: profile.id,
          customerId,
        },
      },
      include: {
        customer: {
          include: {
            user: { select: { id: true, email: true, phone: true, name: true, status: true } },
            subscriptions: {
              where: { distributorId: profile.id },
              include: { product: true, deliverySlot: true },
            },
          },
        },
      },
    });
    if (!link) {
      throwApi(ApiErrorCode.CUSTOMER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return link.customer;
  }

  async updateCustomer(
    userId: string,
    customerId: string,
    dto: UpdateDistributorCustomerDto,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const link = await this.prisma.distributorCustomer.findUnique({
      where: {
        distributorId_customerId: {
          distributorId: profile.id,
          customerId,
        },
      },
      include: { customer: { include: { user: true } } },
    });
    if (!link) {
      throwApi(ApiErrorCode.CUSTOMER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (dto.name || dto.phone) {
      const phone = this.phoneValidation.normalize(dto.phone);
      if (dto.phone !== undefined) {
        await this.phoneValidation.assertUniqueForRole(
          phone,
          UserRole.CUSTOMER,
          link.customer.userId,
        );
      }
      await this.prisma.user.update({
        where: { id: link.customer.userId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.phone !== undefined ? { phone: phone ?? null } : {}),
        },
      });
    }

    const merged = mergeAddressInput(
      {
        ...link.customer,
        lat: dto.lat ?? link.customer.deliveryLat ?? undefined,
        lng: dto.lng ?? link.customer.deliveryLng ?? undefined,
      },
      dto,
    );
    const resolved = await this.geocoding.resolveAddress(merged);
    const locationData = toCustomerLocationData(resolved);

    return this.prisma.customerProfile.update({
      where: { id: customerId },
      data: locationData,
      include: {
        user: { select: { id: true, email: true, phone: true, name: true, status: true } },
      },
    });
  }

  async listSubscriptions(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.subscription.findMany({
      where: { distributorId: profile.id },
      include: {
        customer: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        product: true,
        deliverySlot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscription(userId: string, dto: CreateDistributorSubscriptionDto) {
    assertSubscriptionFlowEnabled();
    const profile = await this.getProfileByUserId(userId);
    await this.validateSubscriptionCreation(profile.id, dto);
    await this.subscriptionEnd.assertNoActiveSubscription(
      profile.id,
      dto.customerId,
    );

    const link = await this.prisma.distributorCustomer.findUnique({
      where: {
        distributorId_customerId: {
          distributorId: profile.id,
          customerId: dto.customerId,
        },
      },
    });
    if (!link) {
      throwApi(ApiErrorCode.CUSTOMER_NOT_LINKED, HttpStatus.BAD_REQUEST);
    }

    const sub = await this.prisma.subscription.create({
      data: {
        distributorId: profile.id,
        customerId: dto.customerId,
        productId: dto.productId,
        pricingId: dto.pricingId,
        quantity: dto.quantity,
        frequency: dto.frequency,
        deliverySlotId: dto.deliverySlotId,
        startDate: new Date(dto.startDate),
        createdVia: OnboardedVia.DISTRIBUTOR_LED,
        fatPercent: dto.fatPercent,
        billingActivationDate: new Date(dto.startDate),
      },
      include: {
        product: true,
        deliverySlot: true,
        customer: { include: { user: true } },
      },
    });

    await this.notifications.createMany([
      {
        userId: sub.customer.user.id,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        title: 'Subscription activated',
        body: `Your subscription for ${sub.product.name} is active.`,
        payload: { subscriptionId: sub.id },
        eventId: `subscription-activated:${sub.id}:customer`,
      },
      {
        userId: profile.userId,
        type: NotificationType.SUBSCRIPTION_ACTIVATED,
        title: 'Subscription created',
        body: `Subscription created for ${sub.customer.user.name}.`,
        payload: { subscriptionId: sub.id },
        eventId: `subscription-activated:${sub.id}:distributor`,
      },
    ]);

    return sub;
  }

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    dto: UpdateDistributorSubscriptionDto,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, distributorId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (
      dto.status === SubscriptionStatus.CANCELLED ||
      dto.status === SubscriptionStatus.PENDING_CANCEL
    ) {
      throwApi(ApiErrorCode.SUBSCRIPTION_END_NOT_ALLOWED, HttpStatus.BAD_REQUEST);
    }
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: dto,
      include: { product: true, deliverySlot: true, customer: true },
    });
  }

  async requestSubscriptionEnd(userId: string, subscriptionId: string, reason?: string) {
    return this.subscriptionEnd.requestEnd(
      subscriptionId,
      UserRole.DISTRIBUTOR,
      userId,
      reason,
    );
  }

  async confirmSubscriptionEnd(userId: string, subscriptionId: string) {
    return this.subscriptionEnd.confirmEnd(
      subscriptionId,
      UserRole.DISTRIBUTOR,
      userId,
    );
  }

  async rejectSubscriptionEnd(userId: string, subscriptionId: string) {
    return this.subscriptionEnd.rejectEnd(
      subscriptionId,
      UserRole.DISTRIBUTOR,
      userId,
    );
  }

  async getSubscriptionEndStatus(userId: string, subscriptionId: string) {
    return this.subscriptionEnd.getEndRequest(
      subscriptionId,
      UserRole.DISTRIBUTOR,
      userId,
    );
  }

  async previewSubscription(
    userId: string,
    subscriptionId: string,
    from: string,
    to: string,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, distributorId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const fromDate = parseDateInput(from);
    const toDate = parseDateInput(to);
    const dates = this.schedule.getDeliveryDates(
      sub.frequency,
      sub.startDate,
      fromDate,
      toDate,
    );
    const pauses = await this.prisma.subscriptionPause.findMany({
      where: { subscriptionId },
    });
    const pausedDates = this.schedule.expandPausedDatesInRange(
      pauses,
      fromDate,
      toDate,
    );
    return {
      subscriptionId,
      from,
      to,
      dates: dates.map(formatDateKey),
      pausedDates,
    };
  }

  private async validateSubscriptionCreation(
    distributorId: string,
    dto: CreateDistributorSubscriptionDto,
  ) {
    const live = await this.readiness.isDistributorLive(distributorId);
    if (!live) {
      throwApi(ApiErrorCode.DISTRIBUTOR_NOT_LIVE, HttpStatus.BAD_REQUEST);
    }

    const pricing = await this.prisma.pricing.findFirst({
      where: {
        distributorId,
        productId: dto.productId,
        active: true,
        ...(dto.fatPercent != null ? { fatPercent: dto.fatPercent } : {}),
      },
    });
    if (!pricing && !dto.pricingId) {
      throwApi(ApiErrorCode.NO_ACTIVE_PRICING, HttpStatus.BAD_REQUEST);
    }

    const slot = await this.prisma.deliverySlot.findFirst({
      where: { id: dto.deliverySlotId, distributorId, active: true },
    });
    if (!slot) {
      throwApi(ApiErrorCode.INVALID_DELIVERY_SLOT, HttpStatus.BAD_REQUEST);
    }
  }

  async listUnavailableDays(userId: string, from?: string, to?: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.distributorUnavailableDay.findMany({
      where: {
        distributorId: profile.id,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: parseDateInput(from) } : {}),
                ...(to ? { lte: parseDateInput(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async createUnavailableDay(userId: string, date: string, reason?: string) {
    const profile = await this.getProfileByUserId(userId);
    const day = parseDateInput(date);

    const existing = await this.prisma.distributorUnavailableDay.findUnique({
      where: {
        distributorId_date: { distributorId: profile.id, date: day },
      },
    });
    if (existing) {
      return existing;
    }

    const row = await this.prisma.distributorUnavailableDay.create({
      data: {
        distributorId: profile.id,
        date: day,
        reason: reason?.trim() || null,
      },
    });

    const activeSubs = await this.prisma.subscription.findMany({
      where: {
        distributorId: profile.id,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        customer: { include: { user: { select: { id: true } } } },
      },
    });

    const dateLabel = formatDateKey(day);
    const reasonSuffix = reason?.trim() ? ` Reason: ${reason.trim()}.` : '';
    await this.notifications.createMany(
      activeSubs.map((sub) => ({
        userId: sub.customer.user.id,
        type: NotificationType.DISTRIBUTOR_UNAVAILABLE,
        title: 'Distributor unavailable',
        body: `${profile.businessName} will not deliver on ${dateLabel}.${reasonSuffix}`,
        payload: {
          distributorId: profile.id,
          date: dateLabel,
          subscriptionId: sub.id,
        },
        eventId: `dist-unavailable:${profile.id}:${dateLabel}:${sub.customer.user.id}`,
      })),
    );

    // Cancel any already-generated pending items for that day
    const pendingItems = await this.prisma.deliveryItem.findMany({
      where: {
        deliveryDate: day,
        status: DeliveryItemStatus.PENDING,
        delivery: { distributorId: profile.id },
      },
      include: {
        customer: { include: { user: true } },
        product: true,
      },
    });

    for (const item of pendingItems) {
      await this.prisma.deliveryItem.update({
        where: { id: item.id },
        data: {
          status: DeliveryItemStatus.SKIPPED,
          notes: reason?.trim() || 'Distributor unavailable',
        },
      });
    }

    return row;
  }

  async deleteUnavailableDay(userId: string, id: string) {
    const profile = await this.getProfileByUserId(userId);
    const row = await this.prisma.distributorUnavailableDay.findFirst({
      where: { id, distributorId: profile.id },
    });
    if (!row) {
      throwApi(ApiErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.prisma.distributorUnavailableDay.delete({ where: { id } });
    return { success: true };
  }
}
