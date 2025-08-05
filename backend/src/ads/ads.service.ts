import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Ad, AdType } from './entities/ad.entity'; // Import AdType
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { deleteFile } from '../shared/utils/file-helpers';

@Injectable()
export class AdsService {
    constructor(
        @InjectRepository(Ad)
        private adsRepository: Repository<Ad>,
        private readonly entityManager: EntityManager,
    ) { }

    async create(createAdDto: CreateAdDto, filePath: string, mimeType: string): Promise<Ad> {
        return this.entityManager.transaction(async (manager) => {
            const adRepository = manager.getRepository(Ad);
            const { displayOrder, ...rest } = createAdDto;
            const type = mimeType.startsWith('video') ? AdType.VIDEO : AdType.IMAGE;

            if (displayOrder !== null && displayOrder !== undefined) {
                await adRepository
                    .createQueryBuilder()
                    .update(Ad)
                    .set({ displayOrder: () => `"displayOrder" + 1` })
                    .where(`"displayOrder" >= :displayOrder`, { displayOrder })
                    .execute();
            }

            const newAd = adRepository.create({
                ...rest,
                type,
                fileUrl: filePath,
                displayOrder,
            });

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

    findAllForAdmin(): Promise<Ad[]> {
        return this.adsRepository.createQueryBuilder('ad')
            .orderBy('ad.displayOrder', 'ASC', 'NULLS LAST')
            .getMany();
    }

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

    async update(id: string, updateAdDto: UpdateAdDto, newFilePath?: string, newMimeType?: string): Promise<Ad> {
        return this.entityManager.transaction(async (manager) => {
            const adRepository = manager.getRepository(Ad);
            const adToUpdate = await adRepository.findOneBy({ id });

            if (!adToUpdate) {
                throw new NotFoundException(`Ad with ID "${id}" not found`);
            }

            const originalOrder = adToUpdate.displayOrder;
            const newOrder = updateAdDto.displayOrder;

            if (newOrder !== undefined && newOrder !== null && newOrder !== originalOrder) {
                if (newOrder < originalOrder) {
                    await adRepository.createQueryBuilder().update(Ad)
                        .set({ displayOrder: () => `"displayOrder" + 1` })
                        .where(`"displayOrder" >= :newOrder AND "displayOrder" < :originalOrder`, { newOrder, originalOrder })
                        .execute();
                } else {
                    await adRepository.createQueryBuilder().update(Ad)
                        .set({ displayOrder: () => `"displayOrder" - 1` })
                        .where(`"displayOrder" > :originalOrder AND "displayOrder" <= :newOrder`, { originalOrder, newOrder })
                        .execute();
                }
            }

            if (newFilePath && adToUpdate.fileUrl) {
                await deleteFile(adToUpdate.fileUrl);
            }

            const updatePayload: any = { ...updateAdDto };
            if (newFilePath) {
                updatePayload.fileUrl = newFilePath;
                updatePayload.type = newMimeType?.startsWith('video') ? AdType.VIDEO : AdType.IMAGE;
            }

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

            if (adToDelete.fileUrl) {
                await deleteFile(adToDelete.fileUrl);
            }

            await adRepository.remove(adToDelete);

            if (adToDelete.displayOrder) {
                await adRepository.createQueryBuilder().update(Ad)
                    .set({ displayOrder: () => `"displayOrder" - 1` })
                    .where(`"displayOrder" > :deletedOrder`, { deletedOrder: adToDelete.displayOrder })
                    .execute();
            }
        });
    }
}
