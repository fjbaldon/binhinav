import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin) // IMPORTANT: Only admins can see audit logs.
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get('merchant-changes')
    findMerchantChanges() {
        // This specific endpoint fulfills the requirement:
        // "see what merchants have changed"
        // The logic is now correctly encapsulated in the service.
        return this.auditLogsService.findMerchantChanges();
    }
}
