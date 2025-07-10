import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskDto } from './dto/update-kiosk.dto';
import { Kiosk } from './entities/kiosk.entity';
import { FloorPlan } from '../floor-plans/entities/floor-plan.entity';

@Injectable()
export class KiosksService {
    constructor(
        @InjectRepository(Kiosk)
        private kiosksRepository: Repository<Kiosk>,
        // We need the FloorPlan repository to check if the floor plan exists
        @InjectRepository(FloorPlan)
        private floorPlansRepository: Repository<FloorPlan>,
    ) { }

    async create(createKioskDto: CreateKioskDto): Promise<Kiosk> {
        const { floorPlanId, ...kioskDetails } = createKioskDto;

        const floorPlan = await this.floorPlansRepository.findOneBy({
            id: floorPlanId,
        });
        if (!floorPlan) {
            throw new BadRequestException(`FloorPlan with ID "${floorPlanId}" not found.`);
        }

        const newKiosk = this.kiosksRepository.create({
            ...kioskDetails,
            floorPlan, // Associate the full floor plan entity
        });

        return this.kiosksRepository.save(newKiosk);
    }

    findAll(): Promise<Kiosk[]> {
        // The 'floorPlan' relation is loaded automatically because of `eager: true` in the entity.
        return this.kiosksRepository.find();
    }

    async findOne(id: string): Promise<Kiosk> {
        const kiosk = await this.kiosksRepository.findOne({ where: { id } });
        if (!kiosk) {
            throw new NotFoundException(`Kiosk with ID "${id}" not found`);
        }
        return kiosk;
    }

    async update(id: string, updateKioskDto: UpdateKioskDto): Promise<Kiosk> {
        const { floorPlanId, ...kioskDetails } = updateKioskDto;

        const updatePayload: any = { ...kioskDetails };

        // If a new floorPlanId is provided, we need to find that floor plan entity
        if (floorPlanId) {
            const floorPlan = await this.floorPlansRepository.findOneBy({
                id: floorPlanId,
            });
            if (!floorPlan) {
                throw new BadRequestException(`FloorPlan with ID "${floorPlanId}" not found.`);
            }
            updatePayload.floorPlan = floorPlan;
        }

        // Preload finds the entity and applies the new values from the DTO
        const kiosk = await this.kiosksRepository.preload({
            id: id,
            ...updatePayload,
        });

        if (!kiosk) {
            throw new NotFoundException(`Kiosk with ID "${id}" not found`);
        }

        return this.kiosksRepository.save(kiosk);
    }

    async remove(id: string): Promise<void> {
        const result = await this.kiosksRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Kiosk with ID "${id}" not found`);
        }
    }
}
