import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    ParseUUIDPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { imageFileFilter, editFileName } from '../shared/utils/file-helpers';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';

@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) { }

    // --- PUBLIC ENDPOINT FOR KIOSK ---
    @Get('active')
    findActiveAds() {
        return this.adsService.findAllActive();
    }

    // --- ADMIN-ONLY ENDPOINTS ---

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(
        FileInterceptor('image', { // The field name for the image file
            storage: diskStorage({
                destination: './uploads/ads',
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    create(
        @Body() createAdDto: CreateAdDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Ad image file is required.');
        }
        const imagePath = file.path.replace(/\\/g, '/');
        return this.adsService.create(createAdDto, imagePath);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    findAllForAdmin() {
        return this.adsService.findAllForAdmin();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.adsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/ads',
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAdDto: UpdateAdDto,
        @UploadedFile() file?: Express.Multer.File, // File is optional on update
    ) {
        const imagePath = file ? file.path.replace(/\\/g, '/') : undefined;
        return this.adsService.update(id, updateAdDto, imagePath);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.adsService.remove(id);
    }
}
