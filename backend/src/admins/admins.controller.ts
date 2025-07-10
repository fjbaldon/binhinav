import { Body, Controller, Patch, Request } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AdminsService } from './admins.service';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    @Patch('me')
    @Roles(Role.Admin)
    updateProfile(@Request() req, @Body() updateAdminDto: UpdateAdminDto) {
        const adminId = req.user.sub; // Or req.user.userId
        return this.adminsService.update(adminId, updateAdminDto);
    }
}
