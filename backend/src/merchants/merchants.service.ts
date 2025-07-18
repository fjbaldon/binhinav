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
            // Catch unique constraint violation on the placeId foreign key
            if (error.code === '23505') { // PostgreSQL's unique violation code
                throw new ConflictException(`The selected place is already assigned to another merchant.`);
            }
            throw error; // Rethrow other errors
        }
    }

    findAll(): Promise<Merchant[]> {
        return this.merchantsRepository.find({
            relations: ['place'],
        });
    }

    async findOne(id: string): Promise<Merchant> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
        return merchant;
    }

    async update(id: string, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
        const merchant = await this.merchantsRepository.preload({
            id: id,
            ...updateMerchantDto,
        });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
        return this.merchantsRepository.save(merchant);
    }

    async remove(id: string): Promise<void> {
        const result = await this.merchantsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
    }

    async findOneByUsername(username: string): Promise<Merchant | undefined> {
        const merchant = await this.merchantsRepository.findOne({
            where: { username },
            relations: ['place'], // Eagerly load the place relation
        });
        return merchant ?? undefined;
    }
}
