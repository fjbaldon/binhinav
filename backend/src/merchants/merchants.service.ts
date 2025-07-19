import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Merchant } from './entities/merchant.entity';

@Injectable()
export class MerchantsService {
    constructor(
        @InjectRepository(Merchant)
        private merchantsRepository: Repository<Merchant>,
    ) { }

    async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
        const { placeId, ...merchantDetails } = createMerchantDto;

        const newMerchant = this.merchantsRepository.create({
            ...merchantDetails,
            place: { id: placeId }, // Associate the place during creation
        });

        try {
            // The password will be hashed automatically by the @BeforeInsert hook.
            return await this.merchantsRepository.save(newMerchant);
        } catch (error) {
            // Catch unique constraint violation on the placeId or username
            if (error.code === '23505') { // PostgreSQL's unique violation code
                if (error.detail?.includes('username')) {
                    throw new ConflictException(`Username "${createMerchantDto.username}" is already taken.`);
                }
                if (error.detail?.includes('placeId')) {
                    throw new ConflictException(`The selected place is already assigned to another merchant.`);
                }
                // Generic fallback for other unique constraints
                throw new ConflictException('A unique constraint was violated. Please check the provided data.');
            }
            throw error; // Rethrow other errors
        }
    }

    findAll(): Promise<Merchant[]> {
        return this.merchantsRepository.createQueryBuilder('merchant')
            .leftJoinAndSelect('merchant.place', 'place')
            .getMany();
    }

    async findOne(id: string): Promise<Merchant> {
        const merchant = await this.merchantsRepository.createQueryBuilder('merchant')
            .leftJoinAndSelect('merchant.place', 'place')
            .where('merchant.id = :id', { id })
            .getOne();

        if (!merchant) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
        return merchant;
    }

    async update(id: string, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
        // The password hash logic is handled by the @BeforeUpdate hook in the entity
        const merchant = await this.merchantsRepository.preload({
            id: id,
            ...updateMerchantDto,
        });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
        try {
            return await this.merchantsRepository.save(merchant);
        } catch (error) {
            if (error.code === '23505' && error.detail?.includes('username')) {
                throw new ConflictException(`Username "${updateMerchantDto.username}" is already taken.`);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const result = await this.merchantsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
    }

    async findOneByUsername(username: string): Promise<Merchant | undefined> {
        const merchant = await this.merchantsRepository.createQueryBuilder('merchant')
            .leftJoinAndSelect('merchant.place', 'place')
            .where('merchant.username = :username', { username })
            .getOne();

        return merchant ?? undefined;
    }
}
