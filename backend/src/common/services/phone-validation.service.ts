import { ApiErrorCode } from '../errors/api-error-code.enum';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwApi } from '../errors/throw-api';

@Injectable()
export class PhoneValidationService {
  constructor(private prisma: PrismaService) {}

  normalize(phone?: string | null): string | undefined {
    const trimmed = phone?.trim();
    return trimmed || undefined;
  }

  async assertUniqueForRole(
    phone: string | undefined | null,
    role: UserRole,
    excludeUserId?: string,
  ) {
    const normalized = this.normalize(phone);
    if (!normalized) {
      return;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        phone: normalized,
        role,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });

    if (existing) {
      throwApi(
        ApiErrorCode.PHONE_ALREADY_REGISTERED,
        HttpStatus.CONFLICT,
      );
    }
  }
}
