import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskDto } from './dto/update-kiosk.dto';
import { Kiosk } from './entities/kiosk.entity';
import { FloorPlan } from '../floor-plans/entities/floor-plan.entity';
import { customAlphabet } from 'nanoid';

const generateProvisioningKey = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

@Injectable()
export class KiosksService {
    constructor(
        @InjectRepository(Kiosk)
        private kiosksRepository: Repository<Kiosk>,
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
            floorPlan,
            provisioningKey: `${generateProvisioningKey().slice(0, 3)}-${generateProvisioningKey().slice(3, 6)}`,
        });

        return this.kiosksRepository.save(newKiosk);
    }

    findAll(): Promise<Kiosk[]> {
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

        if (floorPlanId) {
            const floorPlan = await this.floorPlansRepository.findOneBy({
                id: floorPlanId,
            });
            if (!floorPlan) {
                throw new BadRequestException(`FloorPlan with ID "${floorPlanId}" not found.`);
            }
            updatePayload.floorPlan = floorPlan;
        }

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

    async provision(key: string): Promise<{ id: string; name: string }> {
        const kiosk = await this.kiosksRepository.findOne({ where: { provisioningKey: key } });

        if (!kiosk) {
            throw new NotFoundException('Invalid provisioning key.');
        }

        if (kiosk.isProvisioned) {
            throw new ConflictException('This kiosk has already been provisioned.');
        }

        kiosk.isProvisioned = true;
        kiosk.provisioningKey = null;
        await this.kiosksRepository.save(kiosk);

        return { id: kiosk.id, name: kiosk.name };
    }
}
