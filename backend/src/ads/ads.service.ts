import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Ad } from './entities/ad.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { deleteFile } from '../shared/utils/file-helpers';

@Injectable()
export class AdsService {
    constructor(
        @InjectRepository(Ad)
        private adsRepository: Repository<Ad>,
        private readonly entityManager: EntityManager, // Inject EntityManager for transactions
    ) { }

    async create(createAdDto: CreateAdDto, imagePath: string): Promise<Ad> {
        return this.entityManager.transaction(async (manager) => {
            const adRepository = manager.getRepository(Ad);
            const { displayOrder, ...rest } = createAdDto;

            if (displayOrder !== null && displayOrder !== undefined) {
                // If a display order is specified, make room by shifting subsequent ads
                await adRepository
                    .createQueryBuilder()
                    .update(Ad)
                    .set({ displayOrder: () => `"displayOrder" + 1` })
                    .where(`"displayOrder" >= :displayOrder`, { displayOrder })
                    .execute();
            }

            const newAd = adRepository.create({
                ...rest,
                imageUrl: imagePath,
                displayOrder,
            });

            // If no display order was given, place it at the end
            if (displayOrder === null || displayOrder === undefined) {
                const maxOrderResult = await adRepository
                    .createQueryBuilder('ad')
                    .select('MAX(ad.displayOrder)', 'maxOrder')
                    .getRawOne();
                newAd.displayOrder = (maxOrderResult.maxOrder || 0) + 1;
            }

            return adRepository.save(newAd);
        });
    }

    // For the admin dashboard to see all ads (active and inactive)
    findAllForAdmin(): Promise<Ad[]> {
        return this.adsRepository.createQueryBuilder('ad')
            .orderBy('ad.displayOrder', 'ASC', 'NULLS LAST')
            .getMany();
    }

    // For the public kiosk to get only the active ads
    findAllActive(): Promise<Ad[]> {
        return this.adsRepository.createQueryBuilder('ad')
            .where('ad.isActive = :isActive', { isActive: true })
            .orderBy('ad.displayOrder', 'ASC', 'NULLS LAST')
            .getMany();
    }

    async findOne(id: string): Promise<Ad> {
        const ad = await this.adsRepository.findOneBy({ id });
        if (!ad) {
            throw new NotFoundException(`Ad with ID "${id}" not found`);
        }
        return ad;
    }

    async update(id: string, updateAdDto: UpdateAdDto, newImagePath?: string): Promise<Ad> {
        return this.entityManager.transaction(async (manager) => {
            const adRepository = manager.getRepository(Ad);
            const adToUpdate = await adRepository.findOneBy({ id });

            if (!adToUpdate) {
                throw new NotFoundException(`Ad with ID "${id}" not found`);
            }

            const originalOrder = adToUpdate.displayOrder;
            const newOrder = updateAdDto.displayOrder;

            if (newOrder !== undefined && newOrder !== null && newOrder !== originalOrder) {
                // The display order is being changed, we need to shift other ads
                if (newOrder < originalOrder) {
                    // Moving up in the list (e.g., from 5 to 2)
                    // Increment ads from new position up to old position
                    await adRepository.createQueryBuilder().update(Ad)
                        .set({ displayOrder: () => `"displayOrder" + 1` })
                        .where(`"displayOrder" >= :newOrder AND "displayOrder" < :originalOrder`, { newOrder, originalOrder })
                        .execute();
                } else { // newOrder > originalOrder
                    // Moving down in the list (e.g., from 2 to 5)
                    // Decrement ads from old position down to new position
                    await adRepository.createQueryBuilder().update(Ad)
                        .set({ displayOrder: () => `"displayOrder" - 1` })
                        .where(`"displayOrder" > :originalOrder AND "displayOrder" <= :newOrder`, { originalOrder, newOrder })
                        .execute();
                }
            }

            // If a new image is being uploaded, delete the old one
            if (newImagePath && adToUpdate.imageUrl) {
                await deleteFile(adToUpdate.imageUrl);
            }

            const updatePayload: any = { ...updateAdDto };
            if (newImagePath) {
                updatePayload.imageUrl = newImagePath;
            }

            // Merge changes into the entity
            Object.assign(adToUpdate, updatePayload);

            return adRepository.save(adToUpdate);
        });
    }

    async remove(id: string): Promise<void> {
        await this.entityManager.transaction(async (manager) => {
            const adRepository = manager.getRepository(Ad);
            const adToDelete = await adRepository.findOneBy({ id });

            if (!adToDelete) {
                throw new NotFoundException(`Ad with ID "${id}" not found`);
            }

            // Delete the associated image file from the server
            if (adToDelete.imageUrl) {
                await deleteFile(adToDelete.imageUrl);
            }

            await adRepository.remove(adToDelete);

            // Close the gap left by the deleted ad
            await adRepository.createQueryBuilder().update(Ad)
                .set({ displayOrder: () => `"displayOrder" - 1` })
                .where(`"displayOrder" > :deletedOrder`, { deletedOrder: adToDelete.displayOrder })
                .execute();
        });
    }
}
