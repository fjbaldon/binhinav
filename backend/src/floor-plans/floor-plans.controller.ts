import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FloorPlansService } from './floor-plans.service';
import { CreateFloorPlanDto } from './dto/create-floor-plan.dto';
import { UpdateFloorPlanDto } from './dto/update-floor-plan.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/shared/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { imageFileFilter, editFileName } from '../shared/utils/file-helpers';

@Controller('floor-plans')
export class FloorPlansController {
    constructor(private readonly floorPlansService: FloorPlansService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads/floor-plans',
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    create(
        @Body() createFloorPlanDto: CreateFloorPlanDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('Image file is required');
        }
        const imagePath = file.path.replace(/\\/g, '/');
        return this.floorPlansService.create(createFloorPlanDto, imagePath);
    }

    @Get()
    findAll() {
        return this.floorPlansService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.floorPlansService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @UseInterceptors(
        FileInterceptor('image', { // Intercept the 'image' field from the form-data
            storage: diskStorage({
                destination: './uploads/floor-plans',
                filename: editFileName,
            }),
            fileFilter: imageFileFilter,
        }),
    )
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateFloorPlanDto: UpdateFloorPlanDto,
        // The @UploadedFile decorator injects the file object. It's optional for updates.
        @UploadedFile() file?: Express.Multer.File,
    ) {
        // If a file was uploaded, get its path. Otherwise, it's undefined.
        const imagePath = file ? file.path.replace(/\\/g, '/') : undefined;

        // Pass everything to the service, which contains the logic to handle the update.
        return this.floorPlansService.update(id, updateFloorPlanDto, imagePath);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.floorPlansService.remove(id);
    }
}
