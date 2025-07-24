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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Merchant } from 'src/merchants/entities/merchant.entity';

interface UserPayload {
    userId: string;
    username: string;
    role: string;
    placeId?: string;
}

interface FindAllPlacesOptions {
    searchTerm?: string;
    categoryIds?: string[];
}

@Injectable()
export class PlacesService {
    constructor(
        @InjectRepository(Place)
        private placesRepository: Repository<Place>,
        private readonly auditLogsService: AuditLogsService,
        private readonly merchantsService: MerchantsService,
        private readonly entityManager: EntityManager,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(createPlaceDto: CreatePlaceDto): Promise<Place> {
        return this.entityManager.transaction(async (transactionalEntityManager) => {
            const {
                floorPlanId,
                merchantId,
                newMerchantName,
                newMerchantUsername,
                newMerchantPassword,
                ...placeDetails
            } = createPlaceDto;

            let merchantToAssign: Merchant | null = null;

            if (newMerchantUsername) {
                const merchantRepository = transactionalEntityManager.getRepository(Merchant);
                const existing = await merchantRepository.findOneBy({ username: newMerchantUsername });
                if (existing) {
                    throw new ConflictException(`Merchant username "${newMerchantUsername}" already exists.`);
                }
                const newMerchant = merchantRepository.create({
                    name: newMerchantName,
                    username: newMerchantUsername,
                    password: newMerchantPassword,
                });
                merchantToAssign = await merchantRepository.save(newMerchant);
            }
            else if (merchantId) {
                const merchantRepository = transactionalEntityManager.getRepository(Merchant);
                merchantToAssign = await merchantRepository.findOneBy({ id: merchantId });
                if (!merchantToAssign) {
                    throw new NotFoundException(`Merchant with ID ${merchantId} not found.`);
                }
                
                const placeRepository = transactionalEntityManager.getRepository(Place);
                const existingPlace = await placeRepository.findOne({ where: { merchant: { id: merchantId } } });
                if (existingPlace) {
                    throw new ConflictException(`Merchant with ID ${merchantId} is already assigned to place "${existingPlace.name}".`);
                }
            }

            const newPlaceData: DeepPartial<Place> = {
                ...placeDetails,
                floorPlan: { id: floorPlanId },
                merchant: merchantToAssign,
            };

            const placeRepository = transactionalEntityManager.getRepository(Place);
            const newPlace = placeRepository.create(newPlaceData);
            return placeRepository.save(newPlace);
        });
    }

    async findAll(options: FindAllPlacesOptions = {}, kioskId?: string): Promise<Place[]> {
        const { searchTerm, categoryIds } = options;
        const queryBuilder = this.placesRepository.createQueryBuilder('place');
        queryBuilder.leftJoinAndSelect('place.floorPlan', 'floorPlan').leftJoinAndSelect('place.merchant', 'merchant').leftJoinAndSelect('place.category', 'category');
        if (categoryIds && categoryIds.length > 0) {
            queryBuilder.andWhere('place.categoryId IN (:...ids)', { ids: categoryIds });
        }
        if (searchTerm) {
            queryBuilder.andWhere('(place.name ILIKE :searchTerm OR place.description ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` });
        }
        const places = await queryBuilder.getMany();
        if (kioskId && searchTerm) {
            this.eventEmitter.emit('search.performed', { searchTerm, kioskId, foundResults: places.length > 0 });
        }
        return places;
    }

    async findOne(id: string): Promise<Place> {
        const place = await this.placesRepository.createQueryBuilder('place').leftJoinAndSelect('place.floorPlan', 'floorPlan').leftJoinAndSelect('place.merchant', 'merchant').leftJoinAndSelect('place.category', 'category').where('place.id = :id', { id }).getOne();
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
        return this.entityManager.transaction(async (transactionalEntityManager) => {
            const placeRepository = transactionalEntityManager.getRepository(Place);
            const merchantRepository = transactionalEntityManager.getRepository(Merchant);
            
            const placeToUpdate = await placeRepository.createQueryBuilder('place')
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
                const { newMerchantName, newMerchantUsername, newMerchantPassword, ...adminFields } = updatePlaceDto;

                if (adminFields.name !== undefined) updatePayload.name = adminFields.name;
                if (adminFields.locationX !== undefined) updatePayload.locationX = adminFields.locationX;
                if (adminFields.locationY !== undefined) updatePayload.locationY = adminFields.locationY;
                if (adminFields.floorPlanId) updatePayload.floorPlan = { id: adminFields.floorPlanId };

                let merchantToAssign: Merchant | null | undefined = undefined;

                if (newMerchantUsername) {
                    const existing = await merchantRepository.findOneBy({ username: newMerchantUsername });
                    if (existing) {
                        throw new ConflictException(`Merchant username "${newMerchantUsername}" already exists.`);
                    }
                    const newMerchant = merchantRepository.create({
                        name: newMerchantName,
                        username: newMerchantUsername,
                        password: newMerchantPassword,
                    });
                    merchantToAssign = await merchantRepository.save(newMerchant);
                }
                else if ('merchantId' in adminFields) {
                     if (adminFields.merchantId) {
                        const existingPlace = await placeRepository.findOne({ where: { merchant: { id: adminFields.merchantId } } });
                        if (existingPlace && existingPlace.id !== id) {
                            throw new ConflictException(`Merchant is already assigned to place "${existingPlace.name}".`);
                        }
                        merchantToAssign = await merchantRepository.findOneBy({ id: adminFields.merchantId });
                        if (!merchantToAssign) {
                            throw new NotFoundException(`Merchant with ID "${adminFields.merchantId}" not found.`);
                        }
                    } else {
                        merchantToAssign = null;
                    }
                }
                
                if (merchantToAssign !== undefined) {
                    updatePayload.merchant = merchantToAssign;
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

            const updatedPlace = await placeRepository.preload({
                id,
                ...updatePayload,
            } as DeepPartial<Place>);

            if (!updatedPlace) throw new NotFoundException(`Place with ID "${id}" could not be preloaded.`);
            return placeRepository.save(updatedPlace);
        });
    }

    async remove(id: string): Promise<void> {
        await this.entityManager.transaction(async (transactionalEntityManager) => {
            const placeToDelete = await transactionalEntityManager.findOne(Place, { where: { id }, relations: ['merchant'] });
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
