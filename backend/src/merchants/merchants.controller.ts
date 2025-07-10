import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Request
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes in this controller
export class MerchantsController {
    constructor(private readonly merchantsService: MerchantsService) { }

    @Post()
    @Roles(Role.Admin) // Only Admins can create merchants
    create(@Body() createMerchantDto: CreateMerchantDto) {
        return this.merchantsService.create(createMerchantDto);
    }

    @Get()
    @Roles(Role.Admin) // Only Admins can see the full list of merchants
    findAll() {
        return this.merchantsService.findAll();
    }

    @Get(':id')
    @Roles(Role.Admin) // Only Admins can fetch any merchant by ID
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        // ParseUUIDPipe automatically validates that the 'id' is a valid UUID
        return this.merchantsService.findOne(id);
    }

    // For Admins to update ANY merchant
    @Patch(':id')
    @Roles(Role.Admin)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateMerchantDto) {
        return this.merchantsService.update(id, updateDto);
    }

    // For a Merchant to update THEIR OWN profile/credentials
    @Patch('me')
    @Roles(Role.Merchant)
    updateProfile(@Request() req, @Body() updateDto: UpdateMerchantDto) {
        const merchantId = req.user.userId;
        return this.merchantsService.update(merchantId, updateDto);
    }

    @Delete(':id')
    @Roles(Role.Admin) // Only Admins can delete merchants
    @HttpCode(HttpStatus.NO_CONTENT) // Return 204 No Content on successful deletion
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.merchantsService.remove(id);
    }
}