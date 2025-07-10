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
            imageUrl: imagePath.replace(/\\/g, '/'), // Sanitize path for windows
        });
        try {
            return await this.floorPlansRepository.save(newFloorPlan);
        } catch (error) {
            // ... error handling
            throw new ConflictException('Failed to create FloorPlan');
        }
    }

    findAll(): Promise<FloorPlan[]> {
        // Include the places associated with each floor plan
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
        // <--- MODIFIED: Add file cleanup logic ---
        const floorPlanToUpdate = await this.findOne(id); // Reuse findOne to get the entity

        // If a new image is being uploaded and an old one exists, delete the old one
        if (imagePath && floorPlanToUpdate.imageUrl) {
            await deleteFile(floorPlanToUpdate.imageUrl);
        }

        const updatePayload: any = { ...updateFloorPlanDto };
        // If a new image path is provided, add it to the payload
        if (imagePath) {
            updatePayload.imageUrl = imagePath;
        }

        const floorPlan = await this.floorPlansRepository.preload({
            id,
            ...updatePayload,
        });
        // The preload check for existence is now redundant because findOne does it, but it's harmless
        if (!floorPlan) {
            throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
        }

        try {
            return await this.floorPlansRepository.save(floorPlan);
        } catch (error) {
            // You should handle the error appropriately, e.g., throw a ConflictException or log the error
            throw new ConflictException('Failed to update FloorPlan');
        }
    }

    async remove(id: string): Promise<void> {
        // <--- MODIFIED: Add file cleanup ---
        const floorPlanToDelete = await this.findOne(id);

        // If an image exists, delete it
        if (floorPlanToDelete && floorPlanToDelete.imageUrl) {
            await deleteFile(floorPlanToDelete.imageUrl);
        }

        const result = await this.floorPlansRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`FloorPlan with ID "${id}" not found`);
        }
    }
}
