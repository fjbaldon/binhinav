import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. Get the required roles from the metadata set by the @Roles() decorator
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(), // Check method-level metadata first
            context.getClass(),   // Then check class-level metadata
        ]);

        // 2. If no roles are required, allow access (for public endpoints)
        if (!requiredRoles) {
            return true;
        }

        // 3. Get the user object that JwtAuthGuard attached to the request
        const { user } = context.switchToHttp().getRequest();

        // 4. Check if the user's role is included in the list of required roles
        // The .some() method is perfect here. It returns true as soon as a match is found.
        return requiredRoles.some((role) => user.role === role);
    }
}
