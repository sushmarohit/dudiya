import { HttpStatus, Injectable } from '@nestjs/common';
import {
  OnboardedVia,
  PreferredLocale,
  SetupStatus,
  SubscriptionStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import {
  mergeAddressInput,
  toCustomerLocationData,
} from '../common/address/address.util';
import { NotificationService } from '../notification/notification.service';
import { PhoneValidationService } from '../common/services/phone-validation.service';
import { SubscriptionScheduleService } from '../subscription/subscription-schedule.service';
import { SubscriptionEndService } from '../subscription/subscription-end.service';
import { ReadinessService } from '../distributor/readiness.service';
import { IdentityService } from '../identity/identity.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { formatDateKey, parseDateInput } from '../common/utils/date.util';
import { UpdateCustomerProfileDto } from './dto/update-profile.dto';
import {
  CreateCustomerSubscriptionDto,
  UpdateCustomerSubscriptionDto,
} from './dto/subscription.dto';
import { CatalogService } from '../products/catalog.service';
import {
  assertSubscriptionFlowEnabled,
  isSubscriptionApprovalEnabled,
} from '../common/config/feature-flags';

interface NearbyDistributorRow {
  id: string;
  business_name: string;
  city: string | null;
  service_lat: number;
  service_lng: number;
  service_radius_km: number;
  distance_km: number;
}

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
    private schedule: SubscriptionScheduleService,
    private readiness: ReadinessService,
    private phoneValidation: PhoneValidationService,
    private notifications: NotificationService,
    private catalog: CatalogService,
    private identity: IdentityService,
    private subscriptionEnd: SubscriptionEndService,
  ) {}

  private async getProfileByUserId(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            status: true,
            preferredLocale: true,
          },
        },
      },
    });
    if (!profile) {
      throwApi(ApiErrorCode.CUSTOMER_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return profile;
  }

  async getProfile(userId: string) {
    return this.getProfileByUserId(userId);
  }

  async updateProfile(userId: string, dto: UpdateCustomerProfileDto) {
    const profile = await this.getProfileByUserId(userId);
    const merged = mergeAddressInput(
      {
        ...profile,
        lat: dto.lat ?? profile.deliveryLat ?? undefined,
        lng: dto.lng ?? profile.deliveryLng ?? undefined,
      },
      dto,
    );
    const resolved = await this.geocoding.resolveAddress(merged);
    const locationData = toCustomerLocationData(resolved);

    if (dto.name || dto.phone || dto.preferredLocale) {
      const phone = this.phoneValidation.normalize(dto.phone);
      if (dto.phone !== undefined) {
        await this.phoneValidation.assertUniqueForRole(phone, UserRole.CUSTOMER, userId);
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.phone !== undefined ? { phone: phone ?? null } : {}),
          ...(dto.preferredLocale
            ? {
                preferredLocale:
                  dto.preferredLocale === 'hi'
                    ? PreferredLocale.hi
                    : PreferredLocale.en,
              }
            : {}),
        },
      });
    }

    return this.prisma.customerProfile.update({
      where: { id: profile.id },
      data: locationData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            status: true,
            preferredLocale: true,
          },
        },
      },
    });
  }

  async findNearbyDistributors(
    userId: string,
    lat: number,
    lng: number,
    radiusKm: number,
    page = 1,
    pageSize = 20,
  ) {
    await this.identity.assertCustomerIdentityVerified(userId);
    const offset = (page - 1) * pageSize;
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    const rows = await this.prisma.$queryRaw<NearbyDistributorRow[]>`
      SELECT
        dp.id,
        dp.business_name,
        dp.city,
        dp.service_lat,
        dp.service_lng,
        dp.service_radius_km,
        (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(dp.service_lat)) *
            cos(radians(dp.service_lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(dp.service_lat))
          )
        ) AS distance_km
      FROM distributor_profiles dp
      WHERE dp.identity_verified = true
        AND dp.setup_status = 'GO_LIVE'
        AND dp.service_lat IS NOT NULL
        AND dp.service_lng IS NOT NULL
        AND dp.service_lat BETWEEN ${minLat} AND ${maxLat}
        AND dp.service_lng BETWEEN ${minLng} AND ${maxLng}
        AND EXISTS (
          SELECT 1 FROM pricing p
          WHERE p.distributor_id = dp.id AND p.active = true
        )
        AND EXISTS (
          SELECT 1 FROM delivery_slots ds
          WHERE ds.distributor_id = dp.id AND ds.active = true
        )
        AND (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(dp.service_lat)) *
            cos(radians(dp.service_lng) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(dp.service_lat))
          )
        ) <= LEAST(${radiusKm}, dp.service_radius_km)
      ORDER BY distance_km ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const products = await this.prisma.distributorProduct.findMany({
          where: { distributorId: row.id, enabled: true },
          include: { product: { select: { id: true, name: true, category: true } } },
          take: 5,
        });
        const slots = await this.prisma.deliverySlot.findMany({
          where: { distributorId: row.id, active: true },
          select: { id: true, label: true, startTime: true, endTime: true },
        });
        return {
          id: row.id,
          businessName: row.business_name,
          city: row.city,
          serviceLat: row.service_lat,
          serviceLng: row.service_lng,
          distanceKm: Math.round(row.distance_km * 100) / 100,
          serviceRadiusKm: row.service_radius_km,
          productsSummary: products.map((p) => p.product.name).join(', '),
          products: products.map((p) => p.product),
          deliverySlots: slots,
          slotCount: slots.length,
        };
      }),
    );

    return {
      page,
      pageSize,
      items: enriched,
    };
  }

  async searchDistributorsByName(
    userId: string,
    q: string,
    page = 1,
    pageSize = 20,
  ) {
    await this.identity.assertCustomerIdentityVerified(userId);
    const query = q.trim();
    if (query.length < 2) {
      throwApi(ApiErrorCode.GENERIC, HttpStatus.BAD_REQUEST);
    }

    const offset = (page - 1) * pageSize;
    const profiles = await this.prisma.distributorProfile.findMany({
      where: {
        identityVerified: true,
        setupStatus: SetupStatus.GO_LIVE,
        OR: [
          { businessName: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
        pricing: { some: { active: true } },
        deliverySlots: { some: { active: true } },
      },
      orderBy: { businessName: 'asc' },
      skip: offset,
      take: pageSize,
    });

    const enriched = await Promise.all(
      profiles.map(async (row) => {
        const products = await this.prisma.distributorProduct.findMany({
          where: { distributorId: row.id, enabled: true },
          include: { product: { select: { id: true, name: true, category: true } } },
          take: 5,
        });
        const slots = await this.prisma.deliverySlot.findMany({
          where: { distributorId: row.id, active: true },
          select: { id: true, label: true, startTime: true, endTime: true },
        });
        return {
          id: row.id,
          businessName: row.businessName,
          city: row.city,
          serviceLat: row.serviceLat,
          serviceLng: row.serviceLng,
          distanceKm: null as number | null,
          serviceRadiusKm: row.serviceRadiusKm,
          productsSummary: products.map((p) => p.product.name).join(', '),
          products: products.map((p) => p.product),
          deliverySlots: slots,
          slotCount: slots.length,
        };
      }),
    );

    return { page, pageSize, items: enriched };
  }

  async getDistributorDetail(userId: string, distributorId: string) {
    await this.identity.assertCustomerIdentityVerified(userId);
    const profile = await this.prisma.distributorProfile.findFirst({
      where: {
        id: distributorId,
        identityVerified: true,
        setupStatus: SetupStatus.GO_LIVE,
      },
      include: {
        deliverySlots: { where: { active: true } },
        enabledProducts: {
          where: { enabled: true },
          include: { product: true },
        },
        pricing: {
          where: { active: true },
          include: { product: true },
        },
      },
    });
    if (!profile) {
      throwApi(ApiErrorCode.DISTRIBUTOR_NOT_ELIGIBLE, HttpStatus.NOT_FOUND);
    }
    const { enabledProducts, ...rest } = profile;
    return {
      ...rest,
      products: enabledProducts.map((entry) => ({
        ...entry.product,
        enabled: entry.enabled,
      })),
    };
  }

  async listSubscriptions(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return this.prisma.subscription.findMany({
      where: { customerId: profile.id },
      include: {
        distributor: { select: { id: true, businessName: true } },
        product: true,
        deliverySlot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveActivePricing(
    distributorId: string,
    productId: string,
    pricingId?: string,
    fatPercent?: number,
  ) {
    if (pricingId) {
      const byId = await this.prisma.pricing.findFirst({
        where: {
          id: pricingId,
          distributorId,
          productId,
          active: true,
        },
      });
      if (byId) return byId;
    }

    const candidates = await this.prisma.pricing.findMany({
      where: {
        distributorId,
        productId,
        active: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (candidates.length === 0) {
      throwApi(ApiErrorCode.NO_ACTIVE_PRICING, HttpStatus.BAD_REQUEST);
    }

    if (fatPercent != null) {
      const exact = candidates.find((row) => row.fatPercent === fatPercent);
      if (exact) return exact;
    }

    // Customer does not choose fat — use the distributor's configured price.
    // If multiple variants exist, prefer an explicit pricingId; otherwise take latest.
    return candidates[0];
  }

  async createSubscription(userId: string, dto: CreateCustomerSubscriptionDto) {
    assertSubscriptionFlowEnabled();
    await this.identity.assertCustomerIdentityVerified(userId);
    const profile = await this.getProfileByUserId(userId);
    const live = await this.readiness.isDistributorLive(dto.distributorId);
    if (!live) {
      throwApi(ApiErrorCode.DISTRIBUTOR_NOT_ACCEPTING, HttpStatus.BAD_REQUEST);
    }

    await this.subscriptionEnd.assertNoActiveSubscription(
      dto.distributorId,
      profile.id,
    );

    await this.catalog.assertDistributorCanUseProduct(
      dto.distributorId,
      dto.productId,
    );

    const pricing = await this.resolveActivePricing(
      dto.distributorId,
      dto.productId,
      dto.pricingId,
      dto.fatPercent,
    );

    const slot = await this.prisma.deliverySlot.findFirst({
      where: {
        id: dto.deliverySlotId,
        distributorId: dto.distributorId,
        active: true,
      },
    });
    if (!slot) {
      throwApi(ApiErrorCode.INVALID_DELIVERY_SLOT, HttpStatus.BAD_REQUEST);
    }

    await this.prisma.distributorCustomer.upsert({
      where: {
        distributorId_customerId: {
          distributorId: dto.distributorId,
          customerId: profile.id,
        },
      },
      create: {
        distributorId: dto.distributorId,
        customerId: profile.id,
        onboardedVia: OnboardedVia.SELF_SERVICE,
      },
      update: {},
    });

    const requiresApproval = isSubscriptionApprovalEnabled();

    const sub = await this.prisma.subscription.create({
      data: {
        distributorId: dto.distributorId,
        customerId: profile.id,
        productId: dto.productId,
        pricingId: pricing.id,
        quantity: dto.quantity,
        frequency: dto.frequency,
        deliverySlotId: dto.deliverySlotId,
        startDate: new Date(dto.startDate),
        status: requiresApproval
          ? SubscriptionStatus.PENDING_APPROVAL
          : SubscriptionStatus.ACTIVE,
        createdVia: OnboardedVia.SELF_SERVICE,
        fatPercent: pricing.fatPercent,
        billingActivationDate: new Date(dto.startDate),
      },
      include: {
        distributor: { select: { id: true, businessName: true, userId: true } },
        product: true,
        deliverySlot: true,
      },
    });

    if (requiresApproval) {
      await this.notifications.createMany([
        {
          userId,
          type: NotificationType.SUBSCRIPTION_REQUESTED,
          title: 'Subscription request sent',
          body: `Your request for ${sub.product.name} from ${sub.distributor.businessName} is waiting for approval.`,
          payload: { subscriptionId: sub.id },
          eventId: `subscription-requested:${sub.id}:customer`,
        },
        {
          userId: sub.distributor.userId,
          type: NotificationType.SUBSCRIPTION_REQUESTED,
          title: 'New subscription request',
          body: `A customer requested ${sub.product.name}. Accept or decline the request.`,
          payload: { subscriptionId: sub.id },
          eventId: `subscription-requested:${sub.id}:distributor`,
        },
      ]);
    } else {
      await this.notifications.createMany([
        {
          userId,
          type: NotificationType.SUBSCRIPTION_ACTIVATED,
          title: 'Subscription activated',
          body: `Your subscription for ${sub.product.name} is active.`,
          payload: { subscriptionId: sub.id },
          eventId: `subscription-activated:${sub.id}:customer`,
        },
        {
          userId: sub.distributor.userId,
          type: NotificationType.SUBSCRIPTION_ACTIVATED,
          title: 'New subscription',
          body: `A customer subscribed to ${sub.product.name}.`,
          payload: { subscriptionId: sub.id },
          eventId: `subscription-activated:${sub.id}:distributor`,
        },
      ]);
    }

    return sub;
  }

  async getSubscription(userId: string, subscriptionId: string) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
      include: {
        distributor: { select: { id: true, businessName: true } },
        product: true,
        deliverySlot: true,
      },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return sub;
  }

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    dto: UpdateCustomerSubscriptionDto,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_ACTIVE, HttpStatus.BAD_REQUEST);
    }
    await this.assertBeforeCutoff(sub.distributorId);

    const productId = dto.productId ?? sub.productId;
    const deliverySlotId = dto.deliverySlotId ?? sub.deliverySlotId;

    let pricingId = dto.pricingId ?? sub.pricingId;
    let fatPercent = sub.fatPercent;

    if (dto.productId || dto.deliverySlotId || dto.fatPercent !== undefined || dto.pricingId) {
      const pricing = await this.resolveActivePricing(
        sub.distributorId,
        productId,
        dto.pricingId,
        dto.fatPercent !== undefined ? dto.fatPercent : undefined,
      );
      pricingId = pricing.id;
      fatPercent = pricing.fatPercent;

      const slot = await this.prisma.deliverySlot.findFirst({
        where: {
          id: deliverySlotId,
          distributorId: sub.distributorId,
          active: true,
        },
      });
      if (!slot) {
        throwApi(ApiErrorCode.INVALID_DELIVERY_SLOT, HttpStatus.BAD_REQUEST);
      }

      await this.catalog.assertDistributorCanUseProduct(sub.distributorId, productId);
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(dto.quantity != null ? { quantity: dto.quantity } : {}),
        ...(dto.frequency ? { frequency: dto.frequency } : {}),
        ...(dto.productId ? { productId: dto.productId } : {}),
        ...(dto.deliverySlotId ? { deliverySlotId: dto.deliverySlotId } : {}),
        fatPercent,
        ...(pricingId ? { pricingId } : {}),
      },
      include: {
        distributor: { select: { id: true, businessName: true } },
        product: true,
        deliverySlot: true,
      },
    });
  }

  async pauseSubscription(
    userId: string,
    subscriptionId: string,
    startDate: string,
    endDate: string,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const start = new Date(startDate);
    await this.assertBeforeCutoffForDate(sub.distributorId, start);
    const pause = await this.prisma.subscriptionPause.create({
      data: {
        subscriptionId,
        startDate: start,
        endDate: new Date(endDate),
      },
    });

    const distributor = await this.prisma.distributorProfile.findUnique({
      where: { id: sub.distributorId },
    });
    if (distributor) {
      await this.notifications.create({
        userId: distributor.userId,
        type: NotificationType.PAUSE_APPLIED,
        title:
          startDate === endDate ? 'Delivery skip request' : 'Pause request',
        body:
          startDate === endDate
            ? `Customer skipped delivery on ${startDate}.`
            : `Customer paused subscription from ${startDate} to ${endDate}.`,
        payload: { subscriptionId, pauseId: pause.id, startDate, endDate },
        eventId: `pause-applied:${pause.id}`,
      });
    }

    return pause;
  }

  async extraSubscription(
    userId: string,
    subscriptionId: string,
    date: string,
    extraQuantity: number,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const targetDate = new Date(date);
    await this.assertBeforeCutoffForDate(sub.distributorId, targetDate);
    const extra = await this.prisma.subscriptionExtra.create({
      data: {
        subscriptionId,
        date: targetDate,
        extraQuantity,
      },
    });

    const distributor = await this.prisma.distributorProfile.findUnique({
      where: { id: sub.distributorId },
    });
    if (distributor) {
      await this.notifications.create({
        userId: distributor.userId,
        type: NotificationType.EXTRA_MILK_REQUEST,
        title: 'Extra milk request',
        body: `Customer requested +${extraQuantity} on ${date}.`,
        payload: { subscriptionId, extraId: extra.id },
        eventId: `extra-milk:${extra.id}`,
      });
    }

    return extra;
  }

  async listPauses(userId: string, subscriptionId: string) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.subscriptionPause.findMany({
      where: { subscriptionId },
      orderBy: { startDate: 'desc' },
    });
  }

  async listExtras(userId: string, subscriptionId: string) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
    });
    if (!sub) {
      throwApi(ApiErrorCode.SUBSCRIPTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.prisma.subscriptionExtra.findMany({
      where: { subscriptionId },
      orderBy: { date: 'desc' },
    });
  }

  async previewSubscription(
    userId: string,
    subscriptionId: string,
    from: string,
    to: string,
  ) {
    const profile = await this.getProfileByUserId(userId);
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: profile.id },
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

  async requestSubscriptionEnd(userId: string, subscriptionId: string, reason?: string) {
    return this.subscriptionEnd.requestEnd(
      subscriptionId,
      UserRole.CUSTOMER,
      userId,
      reason,
    );
  }

  async confirmSubscriptionEnd(userId: string, subscriptionId: string) {
    return this.subscriptionEnd.confirmEnd(
      subscriptionId,
      UserRole.CUSTOMER,
      userId,
    );
  }

  async rejectSubscriptionEnd(userId: string, subscriptionId: string) {
    return this.subscriptionEnd.rejectEnd(
      subscriptionId,
      UserRole.CUSTOMER,
      userId,
    );
  }

  async getSubscriptionEndStatus(userId: string, subscriptionId: string) {
    return this.subscriptionEnd.getEndRequest(
      subscriptionId,
      UserRole.CUSTOMER,
      userId,
    );
  }

  private async assertBeforeCutoff(distributorId: string) {
    const settings = await this.prisma.platformSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 1);
    cutoff.setHours(settings.pauseCutoffHour, settings.pauseCutoffMinute, 0, 0);
    if (now >= cutoff) {
      throwApi(ApiErrorCode.SUBSCRIPTION_CUTOFF_PASSED, HttpStatus.FORBIDDEN);
    }
  }

  private async assertBeforeCutoffForDate(distributorId: string, targetDate: Date) {
    const settings = await this.prisma.platformSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    const now = new Date();
    const cutoff = new Date(targetDate);
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(settings.pauseCutoffHour, settings.pauseCutoffMinute, 0, 0);
    if (now > cutoff) {
      throwApi(ApiErrorCode.SUBSCRIPTION_CUTOFF_PASSED, HttpStatus.FORBIDDEN);
    }
  }
}
