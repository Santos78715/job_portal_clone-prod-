import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/admin.decorator';

type RequestWithUser = Request & {
  user?: { role?: Role };
};

function isRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role);
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<unknown>();
    if (!req || typeof req !== 'object') return false;
    const request = req as RequestWithUser;

    const userRoleRaw = request.user?.role;
    if (!isRole(userRoleRaw)) {
      return false;
    }
    const hasRole = requiredRoles.includes(userRoleRaw);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
