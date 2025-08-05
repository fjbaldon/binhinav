import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    @Get('me')
    @Roles(Role.Admin)
    getProfile(@Request() req) {
        const adminId = req.user.userId;
        return this.adminsService.findOne(adminId);
    }

    @Patch('me')
    @Roles(Role.Admin)
    updateProfile(@Request() req, @Body() updateAdminDto: UpdateAdminDto) {
        const adminId = req.user.userId;
        return this.adminsService.update(adminId, updateAdminDto);
    }
}
