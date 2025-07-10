import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KiosksService } from './kiosks.service';
import { KiosksController } from './kiosks.controller';
import { Kiosk } from './entities/kiosk.entity';
import { FloorPlan } from '../floor-plans/entities/floor-plan.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Kiosk, FloorPlan])],
    controllers: [KiosksController],
    providers: [KiosksService],
})
export class KiosksModule { }
