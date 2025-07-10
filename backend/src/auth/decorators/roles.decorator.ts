import { SetMetadata } from '@nestjs/common';
import { Role } from '../../shared/enums/role.enum';

// We use a constant for the metadata key to avoid magic strings
export const ROLES_KEY = 'roles';

// The ...roles syntax allows us to pass multiple roles, e.g., @Roles(Role.Admin, Role.User)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
