import { HttpStatus, Injectable } from '@nestjs/common';
import { IdentityDocumentStatus, SetupStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';

export interface ReadinessResult {
  ready: boolean;
  missing: string[];
}

@Injectable()
export class ReadinessService {
  constructor(private prisma: PrismaService) {}

  async checkReadiness(distributorId: string): Promise<ReadinessResult> {
    const missing: string[] = [];

    const profile = await this.prisma.distributorProfile.findUnique({
      where: { id: distributorId },
    });
    if (!profile) {
      throwApi(ApiErrorCode.DISTRIBUTOR_PROFILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (
      !profile.businessName ||
      !profile.serviceLat ||
      !profile.serviceLng ||
      !profile.serviceRadiusKm
    ) {
      missing.push('business_profile');
    }

    const verifiedDocs = await this.prisma.identityDocument.count({
      where: {
        userId: profile.userId,
        status: IdentityDocumentStatus.VERIFIED,
        filePath: { not: '' },
      },
    });
    if (verifiedDocs === 0 || !profile.identityVerified) {
      missing.push('identity_documents');
    }

    const enabledProducts = await this.prisma.distributorProduct.count({
      where: { distributorId, enabled: true },
    });
    if (enabledProducts === 0) {
      missing.push('products');
    }

    const activePricing = await this.prisma.pricing.count({
      where: { distributorId, active: true },
    });
    if (activePricing === 0) {
      missing.push('pricing');
    }

    const activeSlots = await this.prisma.deliverySlot.count({
      where: { distributorId, active: true },
    });
    if (activeSlots === 0) {
      missing.push('delivery_slots');
    }

    return { ready: missing.length === 0, missing };
  }

  async assertGoLiveEligible(distributorId: string): Promise<ReadinessResult> {
    const result = await this.checkReadiness(distributorId);
    if (!result.ready) {
      throwApi(ApiErrorCode.GO_LIVE_NOT_READY, HttpStatus.BAD_REQUEST, {
        missing: result.missing.join(','),
      });
    }
    return result;
  }

  async isDistributorLive(distributorId: string): Promise<boolean> {
    const profile = await this.prisma.distributorProfile.findUnique({
      where: { id: distributorId },
    });
    if (!profile || profile.setupStatus !== SetupStatus.GO_LIVE) {
      return false;
    }
    const verifiedDocs = await this.prisma.identityDocument.count({
      where: {
        userId: profile.userId,
        status: IdentityDocumentStatus.VERIFIED,
        filePath: { not: '' },
      },
    });
    return profile.identityVerified === true && verifiedDocs > 0;
  }
}
