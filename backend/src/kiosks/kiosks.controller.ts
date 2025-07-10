import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseUUIDPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { KiosksService } from './kiosks.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskDto } from './dto/update-kiosk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';

@Controller('kiosks')
export class KiosksController {
    constructor(private readonly kiosksService: KiosksService) { }

    // --- PUBLIC ENDPOINT FOR KIOSK APP ---
    @Get(':id/public')
    // No auth guard here! This is how the kiosk identifies itself.
    findOnePublic(@Param('id', ParseUUIDPipe) id: string) {
        return this.kiosksService.findOne(id);
    }

    // --- ADMIN-ONLY ENDPOINTS ---

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    create(@Body() createKioskDto: CreateKioskDto) {
        return this.kiosksService.create(createKioskDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    findAll() {
        return this.kiosksService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.kiosksService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateKioskDto: UpdateKioskDto,
    ) {
        return this.kiosksService.update(id, updateKioskDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.kiosksService.remove(id);
    }
}
