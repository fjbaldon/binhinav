import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { AuditLogsModule } from 'src/audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place]),
    AuditLogsModule,
  ],
  controllers: [PlacesController],
  providers: [PlacesService]
})
export class PlacesModule { }
