import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../types/auth-user.type';
import { ApiErrorCode } from '../errors/api-error-code.enum';
import { throwApi } from '../errors/throw-api';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throwApi(ApiErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
