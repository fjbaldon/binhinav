import {
    Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
    UseInterceptors, UploadedFiles, Request,
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
import { ParseUuidArrayPipe } from 'src/shared/pipes/parse-uuid-array.pipe';

@Controller('places')
export class PlacesController {
    constructor(private readonly placesService: PlacesService) { }

    @Post()
    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    create(@Body() createPlaceDto: CreatePlaceDto) {
        return this.placesService.create(createPlaceDto);
    }

    @Get()
    findAll(
        @Query('searchTerm') searchTerm?: string,
        @Query('categoryIds', new ParseUuidArrayPipe())
        categoryIds?: string[],
        @Query('kioskId', new ParseUUIDPipe({ optional: true, version: '4' }))
        kioskId?: string,
    ) {
        return this.placesService.findAll({ searchTerm, categoryIds }, kioskId);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.placesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin, Role.Merchant)
    @UseInterceptors(
        FileFieldsInterceptor([
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
        const logoPath = files?.logo?.[0]?.path.replace(/\\/g, '/');
        const coverPath = files?.cover?.[0]?.path.replace(/\\/g, '/');

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
