import { Body, Controller, Get, Patch, Request, UseGuards, Post, Param, ParseUUIDPipe, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Role } from 'src/shared/enums/role.enum';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SuperAdminGuard } from 'src/auth/guards/super-admin.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }

    @Get('me')
    getProfile(@Request() req) {
        const adminId = req.user.userId;
        return this.adminsService.findOne(adminId);
    }

    @Patch('me')
    updateProfile(@Request() req, @Body() updateAdminDto: UpdateAdminDto) {
        const adminId = req.user.userId;
        return this.adminsService.update(adminId, updateAdminDto, req.user);
    }

    @Post()
    @UseGuards(SuperAdminGuard)
    create(@Body() createAdminDto: CreateAdminDto, @Request() req) {
        return this.adminsService.create(createAdminDto, req.user);
    }

    @Get()
    @UseGuards(SuperAdminGuard)
    findAll() {
        return this.adminsService.findAll();
    }

    @Get(':id')
    @UseGuards(SuperAdminGuard)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(SuperAdminGuard)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAdminDto: UpdateAdminDto, @Request() req) {
        return this.adminsService.update(id, updateAdminDto, req.user);
    }

    @Delete(':id')
    @UseGuards(SuperAdminGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.adminsService.remove(id, req.user);
    }
}
