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
    BadRequestException,
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

    @Get(':id/public')
    findOnePublic(@Param('id', ParseUUIDPipe) id: string) {
        return this.kiosksService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    create(@Body() createKioskDto: CreateKioskDto) {
        return this.kiosksService.create(createKioskDto);
    }

    @Post('provision')
    @HttpCode(HttpStatus.OK)
    provisionKiosk(@Body('key') key: string) {
        if (!key) {
            throw new BadRequestException('Provisioning key is required.');
        }
        return this.kiosksService.provision(key);
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
