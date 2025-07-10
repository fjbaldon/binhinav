import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
    ) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const newCategory = this.categoriesRepository.create(createCategoryDto);
        try {
            return await this.categoriesRepository.save(newCategory);
        } catch (error) {
            // Catch unique constraint violation (error code 23505 for PostgreSQL)
            if (error.code === '23505') {
                throw new ConflictException('A category with this name already exists.');
            }
            throw error;
        }
    }

    // This is public for the kiosk to fetch filter buttons
    findAll(): Promise<Category[]> {
        return this.categoriesRepository.find({
            order: { name: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Category> {
        const category = await this.categoriesRepository.findOneBy({ id });
        if (!category) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }
        return category;
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.categoriesRepository.preload({
            id,
            ...updateCategoryDto,
        });
        if (!category) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }
        try {
            return await this.categoriesRepository.save(category);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('A category with this name already exists.');
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const result = await this.categoriesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Category with ID "${id}" not found`);
        }
    }
}
