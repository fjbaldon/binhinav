import { Injectable, NotFoundException } from '@nestjs/common';
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

    create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
        const newMerchant = this.merchantsRepository.create(createMerchantDto);
        // The password will be hashed automatically by the @BeforeInsert hook in the entity
        return this.merchantsRepository.save(newMerchant);
    }

    findAll(): Promise<Merchant[]> {
        return this.merchantsRepository.find();
    }

    async findOne(id: string): Promise<Merchant> {
        const merchant = await this.merchantsRepository.findOne({ where: { id } });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
        return merchant;
    }

    async update(id: string, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
        // Preload finds the entity and applies the new values from the DTO
        const merchant = await this.merchantsRepository.preload({
            id: id,
            ...updateMerchantDto,
        });
        if (!merchant) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
        // Note: If the password is updated, the @BeforeInsert hook will NOT run.
        // We would need a @BeforeUpdate hook in the entity if we allow password changes here.
        return this.merchantsRepository.save(merchant);
    }

    async remove(id: string): Promise<void> {
        const result = await this.merchantsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Merchant with ID "${id}" not found`);
        }
    }

    async findOneByUsername(username: string): Promise<Merchant | undefined> {
        const merchant = await this.merchantsRepository.findOne({ where: { username } });
        return merchant ?? undefined;
    }
}
