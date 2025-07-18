import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { FloorPlan } from 'src/floor-plans/entities/floor-plan.entity';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { Place } from './entities/place.entity';
import { ForbiddenException } from '@nestjs/common';
import { deleteFile } from '../shared/utils/file-helpers';
import { Category } from 'src/categories/entities/category.entity';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { ActionType } from 'src/audit-logs/enums/action-type.enum';

// Define a simple user payload type for clarity
interface UserPayload {
    userId: string;
    username: string;
    role: string;
}

interface FindAllPlacesOptions {
    searchTerm?: string;
    categoryId?: string;
}

@Injectable()
export class PlacesService {
    constructor(
        @InjectRepository(Place)
        private placesRepository: Repository<Place>,
        private readonly auditLogsService: AuditLogsService,
    ) { }

    async create(createPlaceDto: CreatePlaceDto): Promise<Place> {
        const { floorPlanId, merchantId, categoryId, ...placeDetails } = createPlaceDto;

        if (merchantId) {
            const existingPlace = await this.placesRepository.findOne({ where: { merchant: { id: merchantId } } });
            if (existingPlace) {
                throw new ConflictException(`Merchant with ID ${merchantId} is already assigned to place "${existingPlace.name}".`);
            }
        }

        const newPlace = this.placesRepository.create({
            ...placeDetails,
            floorPlan: { id: floorPlanId } as FloorPlan,
            ...(merchantId && { merchant: { id: merchantId } as Merchant }),
            ...(categoryId && { category: { id: categoryId } as Category }),
            // The lines for logoUrl and coverUrl are removed. They will be null by default.
        });

        return this.placesRepository.save(newPlace);
    }

    async findAll(options: FindAllPlacesOptions = {}): Promise<Place[]> {
        const { searchTerm, categoryId } = options;

        // We will build the `where` clause for the find method.
        // When `where` is an array, TypeORM treats it as an OR condition.
        let whereConditions: any[] = [];

        if (searchTerm) {
            // If a search term is provided, search in both name and description.
            // ILike is a case-insensitive LIKE operator.
            whereConditions.push({ name: ILike(`%${searchTerm}%`) });
            whereConditions.push({ description: ILike(`%${searchTerm}%`) });
        } else {
            // If there's no search term, start with a blank condition to match all places.
            whereConditions.push({});
        }

        if (categoryId) {
            whereConditions = whereConditions.map(condition => ({
                ...condition,
                // This tells TypeORM to filter places where the related category's id matches
                category: { id: categoryId },
            }));
        }

        return this.placesRepository.find({
            // The `where` clause handles our filtering.
            where: whereConditions,
            // We still load the relations so the frontend gets the full info.
            relations: ['floorPlan', 'merchant', 'category'],
        });
    }

    async findOne(id: string): Promise<Place> {
        const place = await this.placesRepository.findOne({
            where: { id },
            relations: ['floorPlan', 'merchant'],
        });
        if (!place) {
            throw new NotFoundException(`Place with ID "${id}" not found`);
        }
        return place;
    }

    async update(
        id: string,
        updatePlaceDto: UpdatePlaceDto,
        user: UserPayload,
        paths: { logoPath?: string, coverPath?: string },
    ): Promise<Place> {
        const placeToUpdate = await this.placesRepository.findOne({
            where: { id },
            relations: ['merchant'],
        });

        if (!placeToUpdate) {
            throw new NotFoundException(`Place with ID "${id}" not found`);
        }

        // We only log changes made by merchants, as per the requirement.
        if (user.role === 'merchant') {
            // You can build a more detailed "changes" object by comparing
            // `placeToUpdate` with `updatePlaceDto` field by field.
            // For now, a simple summary is fine.
            const changes = {
                updatedFields: Object.keys(updatePlaceDto),
                newLogoUploaded: !!paths.logoPath,
                newCoverUploaded: !!paths.coverPath,
            };

            // Non-blocking call to create the log entry
            this.auditLogsService.create({
                entityType: 'Place',
                entityId: id,
                action: ActionType.UPDATE,
                changes: changes,
                userId: user.userId,
                username: user.username,
                userRole: user.role,
            });
        }

        // Cleanup old files if new ones are uploaded
        if (paths.logoPath && placeToUpdate.logoUrl) {
            await deleteFile(placeToUpdate.logoUrl);
        }
        if (paths.coverPath && placeToUpdate.coverUrl) {
            await deleteFile(placeToUpdate.coverUrl);
        }

        if (user.role === 'merchant' && placeToUpdate.merchant?.id !== user.userId) {
            throw new ForbiddenException('You do not have permission to update this place.');
        }

        const { floorPlanId, merchantId, categoryId, ...placeDetails } = updatePlaceDto;

        if (merchantId) {
            // Check if the target merchant is already assigned to ANOTHER place
            const existingPlace = await this.placesRepository.findOne({ where: { merchant: { id: merchantId } } });
            if (existingPlace && existingPlace.id !== id) {
                throw new ConflictException(`Merchant with ID ${merchantId} is already assigned to place "${existingPlace.name}".`);
            }
        }

        const updatePayload: any = { ...placeDetails };

        if (floorPlanId) updatePayload.floorPlan = { id: floorPlanId };
        if (merchantId) updatePayload.merchant = { id: merchantId };

        // This checks if 'categoryId' was present in the request body at all.
        if ('categoryId' in updatePlaceDto) {
            // If a categoryId is provided, create the relation object.
            // If the provided categoryId is null, it will set the relation to null, effectively removing it.
            updatePayload.category = categoryId ? { id: categoryId } : null;
        }

        // Add new paths to payload
        if (paths.logoPath) updatePayload.logoUrl = paths.logoPath;
        if (paths.coverPath) updatePayload.coverUrl = paths.coverPath;

        const updatedPlace = await this.placesRepository.preload({ id, ...updatePayload });

        if (!updatedPlace) throw new NotFoundException(`Place with ID "${id}" not found`);
        return this.placesRepository.save(updatedPlace);
    }

    async remove(id: string): Promise<void> {
        const placeToDelete = await this.findOne(id);

        // Cleanup both files on deletion
        if (placeToDelete.logoUrl) {
            await deleteFile(placeToDelete.logoUrl);
        }
        if (placeToDelete.coverUrl) {
            await deleteFile(placeToDelete.coverUrl);
        }

        const result = await this.placesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Place with ID "${id}" not found`);
        }
    }
}
