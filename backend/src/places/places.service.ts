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
import { MerchantsService } from 'src/merchants/merchants.service';
import { EventEmitter2 } from '@nestjs/event-emitter'; // --- ADDED ---

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
        private readonly merchantsService: MerchantsService,
        private readonly entityManager: EntityManager,
        private eventEmitter: EventEmitter2, // --- ADDED ---
    ) { }

    async create(createPlaceDto: CreatePlaceDto): Promise<Place> {
        // ... (existing code is unchanged)
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

    async findAll(options: FindAllPlacesOptions = {}, kioskId?: string): Promise<Place[]> { // --- UPDATED ---
        const { searchTerm, categoryId } = options;
        const queryBuilder = this.placesRepository.createQueryBuilder('place');

        queryBuilder
            .leftJoinAndSelect('place.floorPlan', 'floorPlan')
            .leftJoinAndSelect('place.merchant', 'merchant')
            .leftJoinAndSelect('place.category', 'category');

        if (categoryId) {
            queryBuilder.andWhere('place.categoryId = :categoryId', { categoryId });
        }

        if (searchTerm) {
            queryBuilder.andWhere(
                '(place.name ILIKE :searchTerm OR place.description ILIKE :searchTerm)',
                { searchTerm: `%${searchTerm}%` },
            );
        }

        const places = await queryBuilder.getMany();

        // --- ADDED: Emit event for search logging ---
        if (kioskId && searchTerm) {
            this.eventEmitter.emit(
                'search.performed',
                {
                    searchTerm,
                    kioskId,
                    foundResults: places.length > 0,
                }
            );
        }
        // --- END OF ADDED CODE ---

        return places;
    }

    async findOne(id: string): Promise<Place> {
        // ... (existing code is unchanged)
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
        // ... (existing code is unchanged, no need to copy it all here)
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

        if (user.role === Role.Merchant) {
            const changes: { [key: string]: { from: any; to: any } } = {};
            if (updatePlaceDto.name !== undefined && placeToUpdate.name !== updatePlaceDto.name) {
                changes.name = { from: placeToUpdate.name, to: updatePlaceDto.name };
            }
            if (updatePlaceDto.description !== undefined && placeToUpdate.description !== updatePlaceDto.description) {
                changes.description = { from: placeToUpdate.description, to: updatePlaceDto.description };
            }
            if (updatePlaceDto.businessHours !== undefined && placeToUpdate.businessHours !== updatePlaceDto.businessHours) {
                changes.businessHours = { from: placeToUpdate.businessHours, to: updatePlaceDto.businessHours };
            }
            if (updatePlaceDto.categoryId !== undefined && (placeToUpdate.category?.id || null) !== updatePlaceDto.categoryId) {
                changes.category = { from: placeToUpdate.category?.name || 'None', to: updatePlaceDto.categoryId };
            }
            if (paths.logoPath) {
                changes.logo = { from: placeToUpdate.logoUrl || null, to: paths.logoPath };
            }
            if (paths.coverPath) {
                changes.cover = { from: placeToUpdate.coverUrl || null, to: paths.coverPath };
            }

            if (Object.keys(changes).length > 0) {
                this.auditLogsService.create({
                    entityType: 'Place', entityId: id, action: ActionType.UPDATE,
                    changes: changes, userId: user.userId, username: user.username, userRole: user.role,
                });
            }
        }

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
        // ... (existing code is unchanged)
        await this.entityManager.transaction(async (transactionalEntityManager) => {
            const placeToDelete = await transactionalEntityManager.findOne(Place, {
                where: { id },
                relations: ['merchant'],
            });

            if (!placeToDelete) {
                throw new NotFoundException(`Place with ID "${id}" not found`);
            }

            if (placeToDelete.merchant) {
                await this.merchantsService.remove(placeToDelete.merchant.id);
            }

            if (placeToDelete.logoUrl) {
                await deleteFile(placeToDelete.logoUrl);
            }
            if (placeToDelete.coverUrl) {
                await deleteFile(placeToDelete.coverUrl);
            }

            const result = await transactionalEntityManager.delete(Place, id);

            if (result.affected === 0) {
                throw new NotFoundException(`Place with ID "${id}" could not be deleted.`);
            }
        });
    }
}
