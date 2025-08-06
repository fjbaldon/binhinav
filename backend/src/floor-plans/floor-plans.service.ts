import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { CreateFloorPlanDto } from './dto/create-floor-plan.dto';
import { UpdateFloorPlanDto } from './dto/update-floor-plan.dto';
import { FloorPlan } from './entities/floor-plan.entity';
import { deleteFile } from 'src/shared/utils/file-helpers';

@Injectable()
export class FloorPlansService {
    constructor(
        @InjectRepository(FloorPlan)
        private floorPlansRepository: Repository<FloorPlan>,
        private readonly entityManager: EntityManager,
    ) { }

    async create(createFloorPlanDto: CreateFloorPlanDto, imagePath: string): Promise<FloorPlan> {
        return this.entityManager.transaction(async (manager) => {
            const floorPlanRepository = manager.getRepository(FloorPlan);
            const { displayOrder, ...rest } = createFloorPlanDto;

            try {
                if (displayOrder !== null && displayOrder !== undefined) {
                    await floorPlanRepository
                        .createQueryBuilder()
                        .update(FloorPlan)
                        .set({ displayOrder: () => `"displayOrder" + 1` })
                        .where(`"displayOrder" >= :displayOrder`, { displayOrder })
                        .execute();
                }

                const newFloorPlan = floorPlanRepository.create({
                    ...rest,
                    imageUrl: imagePath.replace(/\\/g, '/'),
                    displayOrder,
                });

                if (displayOrder === null || displayOrder === undefined) {
                    const maxOrderResult = await floorPlanRepository
                        .createQueryBuilder('fp')
                        .select('MAX(fp.displayOrder)', 'maxOrder')
                        .getRawOne();
                    newFloorPlan.displayOrder = (maxOrderResult.maxOrder === null ? -1 : maxOrderResult.maxOrder) + 1;
                }

                return await floorPlanRepository.save(newFloorPlan);
            } catch (error) {
                if (error.code === '23505') {
                    throw new ConflictException('A floor plan with this name already exists.');
                }
                throw error;
            }
        });
    }

    findAll(): Promise<FloorPlan[]> {
        return this.floorPlansRepository.createQueryBuilder('floor_plan')
            .leftJoinAndSelect('floor_plan.places', 'place')
            .leftJoinAndSelect('floor_plan.kiosks', 'kiosk')
            .orderBy('floor_plan.displayOrder', 'ASC', 'NULLS LAST')
            .getMany();
    }

    async findOne(id: string): Promise<FloorPlan> {
        const floorPlan = await this.floorPlansRepository.createQueryBuilder('floor_plan')
            .leftJoinAndSelect('floor_plan.places', 'place')
            .leftJoinAndSelect('floor_plan.kiosks', 'kiosk')
            .where('floor_plan.id = :id', { id })
            .getOne();

        if (!floorPlan) {
            throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
        }
        return floorPlan;
    }

    async update(
        id: string,
        updateFloorPlanDto: UpdateFloorPlanDto,
        imagePath?: string,
    ): Promise<FloorPlan> {
        return this.entityManager.transaction(async (manager) => {
            const floorPlanRepository = manager.getRepository(FloorPlan);
            const floorPlanToUpdate = await floorPlanRepository.findOneBy({ id });

            if (!floorPlanToUpdate) {
                throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
            }

            const originalOrder = floorPlanToUpdate.displayOrder;
            const newOrder = updateFloorPlanDto.displayOrder;

            if (newOrder !== undefined && newOrder !== null && newOrder !== originalOrder) {
                if (newOrder < originalOrder) {
                    await floorPlanRepository.createQueryBuilder().update(FloorPlan)
                        .set({ displayOrder: () => `"displayOrder" + 1` })
                        .where(`"displayOrder" >= :newOrder AND "displayOrder" < :originalOrder`, { newOrder, originalOrder })
                        .execute();
                } else {
                    await floorPlanRepository.createQueryBuilder().update(FloorPlan)
                        .set({ displayOrder: () => `"displayOrder" - 1` })
                        .where(`"displayOrder" > :originalOrder AND "displayOrder" <= :newOrder`, { originalOrder, newOrder })
                        .execute();
                }
            }

            if (imagePath && floorPlanToUpdate.imageUrl) {
                await deleteFile(floorPlanToUpdate.imageUrl);
            }

            const updatePayload: any = { ...updateFloorPlanDto };
            if (imagePath) {
                updatePayload.imageUrl = imagePath;
            }

            Object.assign(floorPlanToUpdate, updatePayload);
            try {
                return await floorPlanRepository.save(floorPlanToUpdate);
            } catch (error) {
                if (error.code === '23505') {
                    throw new ConflictException('Failed to update FloorPlan. The name might already be in use.');
                }
                throw error;
            }
        });
    }

    async remove(id: string): Promise<void> {
        await this.entityManager.transaction(async (manager) => {
            const floorPlanRepository = manager.getRepository(FloorPlan);
            const floorPlanToDelete = await floorPlanRepository.findOneBy({ id });

            if (!floorPlanToDelete) {
                throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
            }

            if (floorPlanToDelete.imageUrl) {
                await deleteFile(floorPlanToDelete.imageUrl);
            }

            const result = await floorPlanRepository.delete(id);
            if (result.affected === 0) {
                throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
            }

            if (floorPlanToDelete.displayOrder) {
                await floorPlanRepository.createQueryBuilder().update(FloorPlan)
                    .set({ displayOrder: () => `"displayOrder" - 1` })
                    .where(`"displayOrder" > :deletedOrder`, { deletedOrder: floorPlanToDelete.displayOrder })
                    .execute();
            }
        });
    }

    async reorder(ids: string[]): Promise<void> {
        await this.entityManager.transaction(async (transactionalEntityManager) => {
            const floorPlanRepository = transactionalEntityManager.getRepository(FloorPlan);
            await Promise.all(
                ids.map((id, index) => {
                    return floorPlanRepository.update(id, { displayOrder: index });
                })
            );
        });
    }
}
