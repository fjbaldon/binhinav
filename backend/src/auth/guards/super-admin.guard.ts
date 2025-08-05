import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../../shared/enums/role.enum';

@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();

        if (user.role === Role.Admin && user.isSuperAdmin) {
            return true;
        }

        throw new ForbiddenException('You do not have permission to perform this action.');
    }
}
