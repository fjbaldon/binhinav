import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, DeepPartial } from 'typeorm';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { deleteFile } from '../shared/utils/file-helpers';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { ActionType } from 'src/audit-logs/enums/action-type.enum';
import { Role } from 'src/shared/enums/role.enum';

interface UserPayload {
    userId: string;
    username: string;
    role: string;
    placeId?: string;
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
        const { floorPlanId, merchantId, ...placeDetails } = createPlaceDto;

        if (merchantId) {
            const existingPlace = await this.placesRepository.findOne({ where: { merchant: { id: merchantId } } });
            if (existingPlace) {
                throw new ConflictException(`Merchant with ID ${merchantId} is already assigned to place "${existingPlace.name}".`);
            }
        }

        const newPlaceData: DeepPartial<Place> = {
            ...placeDetails,
            floorPlan: { id: floorPlanId },
            ...(merchantId && { merchant: { id: merchantId } }),
        };

        const newPlace = this.placesRepository.create(newPlaceData);
        return this.placesRepository.save(newPlace);
    }

    async findAll(options: FindAllPlacesOptions = {}): Promise<Place[]> {
        const { searchTerm, categoryId } = options;
        const queryBuilder = this.placesRepository.createQueryBuilder('place');

        // Eagerly load relations for the final result
        queryBuilder
            .leftJoinAndSelect('place.floorPlan', 'floorPlan')
            .leftJoinAndSelect('place.merchant', 'merchant')
            .leftJoinAndSelect('place.category', 'category');

        // Apply category filter if provided
        if (categoryId) {
            queryBuilder.andWhere('place.categoryId = :categoryId', { categoryId });
        }

        // Apply search term filter if provided
        if (searchTerm) {
            queryBuilder.andWhere(
                '(place.name ILIKE :searchTerm OR place.description ILIKE :searchTerm)',
                { searchTerm: `%${searchTerm}%` },
            );
        }

        return queryBuilder.getMany();
    }

    async findOne(id: string): Promise<Place> {
        const place = await this.placesRepository.findOne({
            where: { id },
            relations: ['floorPlan', 'merchant', 'category'],
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
        paths: { logoPath?: string; coverPath?: string },
    ): Promise<Place> {
        const placeToUpdate = await this.placesRepository.findOne({
            where: { id },
            relations: ['merchant', 'category'], // Eager load category to get its name for logging
        });

        if (!placeToUpdate) {
            throw new NotFoundException(`Place with ID "${id}" not found`);
        }

        if (user.role === Role.Merchant && placeToUpdate.merchant?.id !== user.userId) {
            throw new ForbiddenException('You do not have permission to update this place.');
        }

        // --- IMPROVED AUDIT LOGGING ---
        if (user.role === Role.Merchant) {
            const changes: { [key: string]: { from: any; to: any } } = {};

            // Check for changes in text fields
            if (updatePlaceDto.name !== undefined && placeToUpdate.name !== updatePlaceDto.name) {
                changes.name = { from: placeToUpdate.name, to: updatePlaceDto.name };
            }
            if (updatePlaceDto.description !== undefined && placeToUpdate.description !== updatePlaceDto.description) {
                changes.description = { from: placeToUpdate.description, to: updatePlaceDto.description };
            }
            if (updatePlaceDto.businessHours !== undefined && placeToUpdate.businessHours !== updatePlaceDto.businessHours) {
                changes.businessHours = { from: placeToUpdate.businessHours, to: updatePlaceDto.businessHours };
            }
            // Check for category change
            if ('categoryId' in updatePlaceDto && (placeToUpdate.category?.id || null) !== updatePlaceDto.categoryId) {
                // Log the old category name and the new category ID. The frontend will map the ID to a name.
                changes.category = { from: placeToUpdate.category?.name || 'None', to: updatePlaceDto.categoryId };
            }
            // Check for file uploads
            if (paths.logoPath) {
                changes.logo = { from: placeToUpdate.logoUrl || null, to: paths.logoPath };
            }
            if (paths.coverPath) {
                changes.cover = { from: placeToUpdate.coverUrl || null, to: paths.coverPath };
            }

            // Only create a log entry if there were actual changes
            if (Object.keys(changes).length > 0) {
                this.auditLogsService.create({
                    entityType: 'Place', entityId: id, action: ActionType.UPDATE,
                    changes: changes, userId: user.userId, username: user.username, userRole: user.role,
                });
            }
        }
        // --- END OF AUDIT LOGGING ---

        if (paths.logoPath && placeToUpdate.logoUrl) await deleteFile(placeToUpdate.logoUrl);
        if (paths.coverPath && placeToUpdate.coverUrl) await deleteFile(placeToUpdate.coverUrl);

        const updatePayload: { [key: string]: any } = {};

        if (user.role === Role.Admin) {
            if (updatePlaceDto.name !== undefined) updatePayload.name = updatePlaceDto.name;
            if (updatePlaceDto.locationX !== undefined) updatePayload.locationX = updatePlaceDto.locationX;
            if (updatePlaceDto.locationY !== undefined) updatePayload.locationY = updatePlaceDto.locationY;
            if (updatePlaceDto.floorPlanId) updatePayload.floorPlan = { id: updatePlaceDto.floorPlanId };

            if ('merchantId' in updatePlaceDto) {
                if (updatePlaceDto.merchantId) {
                    const existingPlace = await this.placesRepository.findOne({ where: { merchant: { id: updatePlaceDto.merchantId } } });
                    if (existingPlace && existingPlace.id !== id) {
                        throw new ConflictException(`Merchant is already assigned to place "${existingPlace.name}".`);
                    }
                }
                updatePayload.merchant = updatePlaceDto.merchantId ? { id: updatePlaceDto.merchantId } : null;
            }
        } else if (user.role === Role.Merchant) {
            if (updatePlaceDto.name !== undefined) updatePayload.name = updatePlaceDto.name;
            if (updatePlaceDto.description !== undefined) updatePayload.description = updatePlaceDto.description;
            if (updatePlaceDto.businessHours !== undefined) updatePayload.businessHours = updatePlaceDto.businessHours;

            if ('categoryId' in updatePlaceDto) {
                updatePayload.category = updatePlaceDto.categoryId ? { id: updatePlaceDto.categoryId } : null;
            }

            if (paths.logoPath) updatePayload.logoUrl = paths.logoPath;
            if (paths.coverPath) updatePayload.coverUrl = paths.coverPath;
        }

        const updatedPlace = await this.placesRepository.preload({
            id,
            ...updatePayload,
        } as DeepPartial<Place>);

        if (!updatedPlace) throw new NotFoundException(`Place with ID "${id}" could not be preloaded.`);
        return this.placesRepository.save(updatedPlace);
    }

    async remove(id: string): Promise<void> {
        const placeToDelete = await this.findOne(id);

        if (placeToDelete.logoUrl) await deleteFile(placeToDelete.logoUrl);
        if (placeToDelete.coverUrl) await deleteFile(placeToDelete.coverUrl);

        const result = await this.placesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Place with ID "${id}" not found`);
        }
    }
}
