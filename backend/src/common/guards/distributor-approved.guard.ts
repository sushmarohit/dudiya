import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user.type';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import { throwApi } from '../errors/throw-api';

/**
 * Ensures the caller is an active distributor with a profile.
 * Admin approval is no longer required — identity docs gate go-live/visibility.
 */
@Injectable()
export class DistributorApprovedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = request.user;

    if (!user || user.role !== UserRole.DISTRIBUTOR) {
      return true;
    }

    if (user.status === UserStatus.SUSPENDED) {
      throwApi(ApiErrorCode.ACCOUNT_SUSPENDED, HttpStatus.FORBIDDEN);
    }

    const profile = await this.prisma.distributorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throwApi(ApiErrorCode.DISTRIBUTOR_PROFILE_NOT_FOUND, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
