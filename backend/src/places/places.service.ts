import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, EntityManager } from 'typeorm';
import { Place } from './entities/place.entity';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { deleteFile } from '../shared/utils/file-helpers';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { ActionType } from 'src/audit-logs/enums/action-type.enum';
import { Role } from 'src/shared/enums/role.enum';
import { MerchantsService } from 'src/merchants/merchants.service'; // Import MerchantsService

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
        private readonly merchantsService: MerchantsService, // Inject MerchantsService
        private readonly entityManager: EntityManager, // Inject EntityManager for transactions
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
        const place = await this.placesRepository.createQueryBuilder('place')
            .leftJoinAndSelect('place.floorPlan', 'floorPlan')
            .leftJoinAndSelect('place.merchant', 'merchant')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.id = :id', { id })
            .getOne();

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
        const placeToUpdate = await this.placesRepository.createQueryBuilder('place')
            .leftJoinAndSelect('place.merchant', 'merchant')
            .leftJoinAndSelect('place.category', 'category')
            .where('place.id = :id', { id })
            .getOne();

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
            if (updatePlaceDto.categoryId !== undefined && (placeToUpdate.category?.id || null) !== updatePlaceDto.categoryId) {
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

            // The check must be for `undefined`, not for key existence. A value of `null` is
            // intentional (to unset the category), but `undefined` means the field was not sent.
            if (updatePlaceDto.categoryId !== undefined) {
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
        await this.entityManager.transaction(async (transactionalEntityManager) => {
            const placeToDelete = await transactionalEntityManager.findOne(Place, {
                where: { id },
                relations: ['merchant'], // Eagerly load the associated merchant
            });

            if (!placeToDelete) {
                throw new NotFoundException(`Place with ID "${id}" not found`);
            }

            // If there's an associated merchant, delete them first.
            if (placeToDelete.merchant) {
                // The merchants service already handles cascading deletes or other logic.
                // We don't need to call the repository directly.
                await this.merchantsService.remove(placeToDelete.merchant.id);
            }

            // Delete associated images
            if (placeToDelete.logoUrl) {
                await deleteFile(placeToDelete.logoUrl);
            }
            if (placeToDelete.coverUrl) {
                await deleteFile(placeToDelete.coverUrl);
            }

            // Finally, delete the place itself.
            const result = await transactionalEntityManager.delete(Place, id);

            // This check is good practice within a transaction as well.
            if (result.affected === 0) {
                // This would be unusual if findOne succeeded, but it's a safeguard.
                throw new NotFoundException(`Place with ID "${id}" could not be deleted.`);
            }
        });
    }
}
