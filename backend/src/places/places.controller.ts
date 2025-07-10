import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
    UseInterceptors, UploadedFiles, Request,
    ParseEnumPipe,
} from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/shared/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { diskStorage } from 'multer';
import { imageFileFilter, editFileName } from '../shared/utils/file-helpers';
import { Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('places')
export class PlacesController {
    constructor(private readonly placesService: PlacesService) { }

    @Post()
    @Roles(Role.Admin)
    @UseInterceptors(
        // Use FileFieldsInterceptor to handle multiple named fields
        FileFieldsInterceptor([
            { name: 'logo', maxCount: 1 },
            { name: 'cover', maxCount: 1 },
        ], {
            storage: diskStorage({
                destination: './uploads/places', // A general folder for place images
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    create(
        @Body() createPlaceDto: CreatePlaceDto,
        @UploadedFiles() files: { logo?: Express.Multer.File[], cover?: Express.Multer.File[] },
    ) {
        const logoPath = files.logo?.[0]?.path.replace(/\\/g, '/');
        const coverPath = files.cover?.[0]?.path.replace(/\\/g, '/');
        // Pass both paths to the service
        return this.placesService.create(createPlaceDto, { logoPath, coverPath });
    }

    // This endpoint is for the public kiosk view, so no roles needed, just needs to be a valid route
    @Get()
    findAll(
        @Query('search') searchTerm?: string,
        @Query('categoryId', new ParseUUIDPipe({ optional: true, version: '4' }))
        categoryId?: string,
    ) {
        return this.placesService.findAll({ searchTerm, categoryId });
    }

    @Get(':id')
    // This could be public or admin-only, let's make it public for now
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.placesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Merchant) // <-- See secondary requirement below
    @UseInterceptors(
        FileFieldsInterceptor([ // Also use it here for updates
            { name: 'logo', maxCount: 1 },
            { name: 'cover', maxCount: 1 },
        ], {
            storage: diskStorage({
                destination: './uploads/places',
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePlaceDto: UpdatePlaceDto,
        @Request() req,
        @UploadedFiles() files: { logo?: Express.Multer.File[], cover?: Express.Multer.File[] },
    ) {
        const user = req.user;
        const logoPath = files.logo?.[0]?.path.replace(/\\/g, '/');
        const coverPath = files.cover?.[0]?.path.replace(/\\/g, '/');

        return this.placesService.update(id, updatePlaceDto, user, { logoPath, coverPath });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.placesService.remove(id);
    }
}
