import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  ApprovalStatus,
  PreferredLocale,
  SetupStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import { JwtPayload } from '../common/types/auth-user.type';
import { RegisterDto, RegisterRoleDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PhoneValidationService } from '../common/services/phone-validation.service';
import { ApiErrorCode } from '../common/errors/api-error-code.enum';
import { throwApi } from '../common/errors/throw-api';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private geocoding: GeocodingService,
    private phoneValidation: PhoneValidationService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throwApi(
        ApiErrorCode.EMAIL_ALREADY_REGISTERED,
        HttpStatus.CONFLICT,
      );
    }

    const role =
      dto.role === RegisterRoleDto.DISTRIBUTOR
        ? UserRole.DISTRIBUTOR
        : UserRole.CUSTOMER;
    const phone = this.phoneValidation.normalize(dto.phone);
    await this.phoneValidation.assertUniqueForRole(phone, role);

    const preferredLocale = this.resolvePreferredLocale(dto.preferredLocale);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    if (dto.role === RegisterRoleDto.DISTRIBUTOR) {
      if (!dto.businessName) {
        throwApi(ApiErrorCode.BUSINESS_NAME_REQUIRED, HttpStatus.BAD_REQUEST);
      }
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          phone,
          name: dto.name,
          passwordHash,
          role: UserRole.DISTRIBUTOR,
          status: UserStatus.ACTIVE,
          preferredLocale,
          distributorProfile: {
            create: {
              businessName: dto.businessName,
              ownerName: dto.ownerName,
              approvalStatus: ApprovalStatus.APPROVED,
              setupStatus: SetupStatus.INCOMPLETE,
              identityVerified: false,
            },
          },
        },
      });
      return this.buildAuthResponse(user);
    }

    const resolved = await this.geocoding.resolveAddress({
      addressType: dto.addressType,
      flatOrHouseNo: dto.flatOrHouseNo,
      buildingOrSociety: dto.buildingOrSociety,
      streetOrLane: dto.streetOrLane,
      landmark: dto.landmark,
      village: dto.village,
      district: dto.district,
      state: dto.state,
      addressLine: dto.addressLine,
      city: dto.city,
      pincode: dto.pincode,
      lat: dto.lat,
      lng: dto.lng,
    });
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone,
        name: dto.name,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        preferredLocale,
        customerProfile: {
          create: {
            addressType: resolved.addressType,
            flatOrHouseNo: resolved.flatOrHouseNo,
            buildingOrSociety: resolved.buildingOrSociety,
            streetOrLane: resolved.streetOrLane,
            landmark: resolved.landmark,
            village: resolved.village,
            district: resolved.district,
            state: resolved.state,
            addressLine: resolved.addressLine,
            formattedAddress: resolved.formattedAddress,
            city: resolved.city,
            pincode: resolved.pincode,
            deliveryLat: resolved.lat,
            deliveryLng: resolved.lng,
          },
        },
      },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throwApi(
        ApiErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throwApi(
        ApiErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.status === UserStatus.SUSPENDED) {
      throwApi(
        ApiErrorCode.ACCOUNT_SUSPENDED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throwApi(ApiErrorCode.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.buildAuthResponse(stored.user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const locale = user.preferredLocale === 'hi' ? 'hi' : 'en';
    const resetUrl = `${frontendUrl}/${locale}/reset-password?token=${token}`;

    try {
      const result = await this.emailService.sendPasswordReset(
        user.email,
        resetUrl,
        user.name,
      );
      if (!result.sent) {
        // Dev / misconfigured SMTP: keep link visible in server logs.
        console.log(`[dev] Password reset link: ${resetUrl}`);
      }
    } catch {
      console.log(`[dev] Password reset link (email failed): ${resetUrl}`);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throwApi(ApiErrorCode.INVALID_RESET_TOKEN, HttpStatus.BAD_REQUEST);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Password reset successful' };
  }

  async activate(token: string, password: string) {
    const record = await this.prisma.activationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throwApi(ApiErrorCode.INVALID_ACTIVATION_TOKEN, HttpStatus.BAD_REQUEST);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, status: UserStatus.ACTIVE },
      }),
      this.prisma.activationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return this.buildAuthResponse({ ...record.user, status: UserStatus.ACTIVE });
  }

  async updatePreferredLocale(userId: string, locale: 'en' | 'hi') {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        preferredLocale:
          locale === 'hi' ? PreferredLocale.hi : PreferredLocale.en,
      },
      select: { preferredLocale: true },
    });
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    role: UserRole;
    status: UserStatus;
    preferredLocale?: PreferredLocale | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? null,
        role: user.role,
        status: user.status,
        preferredLocale: user.preferredLocale ?? PreferredLocale.en,
      },
    };
  }

  private resolvePreferredLocale(locale?: string): PreferredLocale {
    return locale === PreferredLocale.hi
      ? PreferredLocale.hi
      : PreferredLocale.en;
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
    return token;
  }
}
