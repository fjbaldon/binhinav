import {
    Controller, Get, Body, Patch, Param, Delete,
    UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Request
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantsController {
    constructor(private readonly merchantsService: MerchantsService) { }

    @Get()
    @Roles(Role.Admin)
    findAll() {
        return this.merchantsService.findAll();
    }

    @Patch('me')
    @Roles(Role.Merchant)
    updateProfile(@Request() req, @Body() updateDto: UpdateMerchantDto) {
        const merchantId = req.user.userId;
        return this.merchantsService.update(merchantId, updateDto);
    }

    @Get(':id')
    @Roles(Role.Admin)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.merchantsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateMerchantDto) {
        return this.merchantsService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.merchantsService.remove(id);
    }
}
