import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    @Patch('me')
    @Roles(Role.Admin)
    updateProfile(@Request() req, @Body() updateAdminDto: UpdateAdminDto) {
        const adminId = req.user.userId;
        return this.adminsService.update(adminId, updateAdminDto);
    }
}
