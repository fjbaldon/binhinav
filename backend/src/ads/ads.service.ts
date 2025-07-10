import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ad } from './entities/ad.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { deleteFile } from '../shared/utils/file-helpers';

@Injectable()
export class AdsService {
    constructor(
        @InjectRepository(Ad)
        private adsRepository: Repository<Ad>,
    ) { }

    async create(createAdDto: CreateAdDto, imagePath: string): Promise<Ad> {
        const newAd = this.adsRepository.create({
            ...createAdDto,
            imageUrl: imagePath,
        });
        return this.adsRepository.save(newAd);
    }

    // For the admin dashboard to see all ads (active and inactive)
    findAllForAdmin(): Promise<Ad[]> {
        return this.adsRepository.find({
            order: {
                displayOrder: 'ASC',
                name: 'ASC',
            },
        });
    }

    // For the public kiosk to get only the active ads
    findAllActive(): Promise<Ad[]> {
        return this.adsRepository.find({
            where: { isActive: true },
            order: {
                displayOrder: 'ASC',
            },
        });
    }

    async findOne(id: string): Promise<Ad> {
        const ad = await this.adsRepository.findOneBy({ id });
        if (!ad) {
            throw new NotFoundException(`Ad with ID "${id}" not found`);
        }
        return ad;
    }

    async update(id: string, updateAdDto: UpdateAdDto, newImagePath?: string): Promise<Ad> {
        const adToUpdate = await this.findOne(id);

        // If a new image is being uploaded, delete the old one
        if (newImagePath && adToUpdate.imageUrl) {
            await deleteFile(adToUpdate.imageUrl);
        }

        const updatePayload: any = { ...updateAdDto };
        if (newImagePath) {
            updatePayload.imageUrl = newImagePath;
        }

        const ad = await this.adsRepository.preload({
            id,
            ...updatePayload,
        });

        if (!ad) {
            throw new NotFoundException(`Ad with ID "${id}" not found`);
        }

        return this.adsRepository.save(ad);
    }

    async remove(id: string): Promise<void> {
        const adToDelete = await this.findOne(id);

        // Delete the associated image file from the server
        if (adToDelete.imageUrl) {
            await deleteFile(adToDelete.imageUrl);
        }

        const result = await this.adsRepository.delete(id);
        if (result.affected === 0) {
            // This is a fallback, as findOne should have already thrown an error
            throw new NotFoundException(`Ad with ID "${id}" not found`);
        }
    }
}
