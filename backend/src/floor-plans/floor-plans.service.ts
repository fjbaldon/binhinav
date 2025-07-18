import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFloorPlanDto } from './dto/create-floor-plan.dto';
import { UpdateFloorPlanDto } from './dto/update-floor-plan.dto';
import { FloorPlan } from './entities/floor-plan.entity';
import { deleteFile } from 'src/shared/utils/file-helpers';

@Injectable()
export class FloorPlansService {
    constructor(
        @InjectRepository(FloorPlan)
        private floorPlansRepository: Repository<FloorPlan>,
    ) { }

    async create(createFloorPlanDto: CreateFloorPlanDto, imagePath: string): Promise<FloorPlan> {
        const newFloorPlan = this.floorPlansRepository.create({
            ...createFloorPlanDto,
            imageUrl: imagePath.replace(/\\/g, '/'),
        });
        try {
            return await this.floorPlansRepository.save(newFloorPlan);
        } catch (error) {
            throw new ConflictException('A floor plan with this name already exists.');
        }
    }

    findAll(): Promise<FloorPlan[]> {
        return this.floorPlansRepository.find({ relations: ['places'] });
    }

    async findOne(id: string): Promise<FloorPlan> {
        const floorPlan = await this.floorPlansRepository.findOne({
            where: { id },
            relations: ['places'],
        });
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
        const floorPlanToUpdate = await this.findOne(id);

        if (imagePath && floorPlanToUpdate.imageUrl) {
            await deleteFile(floorPlanToUpdate.imageUrl);
        }

        const updatePayload: any = { ...updateFloorPlanDto };
        if (imagePath) {
            updatePayload.imageUrl = imagePath;
        }

        const floorPlan = await this.floorPlansRepository.preload({
            id,
            ...updatePayload,
        });

        if (!floorPlan) {
            throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
        }

        try {
            return await this.floorPlansRepository.save(floorPlan);
        } catch (error) {
            throw new ConflictException('Failed to update FloorPlan. The name might already be in use.');
        }
    }

    async remove(id: string): Promise<void> {
        const floorPlanToDelete = await this.findOne(id);

        if (floorPlanToDelete && floorPlanToDelete.imageUrl) {
            await deleteFile(floorPlanToDelete.imageUrl);
        }

        const result = await this.floorPlansRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
        }
    }
}
