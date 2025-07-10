import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place]),
  ],
  controllers: [PlacesController],
  providers: [PlacesService]
})
export class PlacesModule { }
