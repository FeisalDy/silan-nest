import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { Role } from '@/common/constants/role.constant';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return true;
        }

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            'roles',
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles?.length) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest<Request>();

        if (user.role === Role.ADMIN) {
            return true;
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException(
                'You do not have permission for this action'
            );
        }

        return true;
    }
}
