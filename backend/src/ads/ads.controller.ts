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
import { adFileFilter, editFileName } from '../shared/utils/file-helpers';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';
import { ReorderAdsDto } from './dto/reorder-ads.dto'; // Import the new DTO

@Controller('ads')
export class AdsController {
    constructor(private readonly adsService: AdsService) { }

    @Get('active')
    findActiveAds() {
        return this.adsService.findAllActive();
    }
    
    @Patch('reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.OK)
    reorder(@Body() reorderAdsDto: ReorderAdsDto) {
        return this.adsService.reorder(reorderAdsDto.ids);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/ads',
                filename: editFileName,
            }),
            fileFilter: adFileFilter,
        }),
    )
    create(
        @Body() createAdDto: CreateAdDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Ad file (image or video) is required.');
        }
        const filePath = file.path.replace(/\\/g, '/');
        return this.adsService.create(createAdDto, filePath, file.mimetype);
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
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/ads',
                filename: editFileName,
            }),
            fileFilter: adFileFilter,
        }),
    )
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAdDto: UpdateAdDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const filePath = file ? file.path.replace(/\\/g, '/') : undefined;
        const mimeType = file ? file.mimetype : undefined;
        return this.adsService.update(id, updateAdDto, filePath, mimeType);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.adsService.remove(id);
    }
}
