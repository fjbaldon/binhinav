import { Module } from '@nestjs/common';
import { FloorPlansController } from './floor-plans.controller';
import { FloorPlansService } from './floor-plans.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloorPlan } from './entities/floor-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FloorPlan]),
  ],
  controllers: [FloorPlansController],
  providers: [FloorPlansService]
})
export class FloorPlansModule { }
