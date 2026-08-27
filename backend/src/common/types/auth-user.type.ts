import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
}
