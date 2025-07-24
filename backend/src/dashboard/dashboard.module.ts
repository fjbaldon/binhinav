import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from 'src/places/entities/place.entity';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { Kiosk } from 'src/kiosks/entities/kiosk.entity';
import { Ad } from 'src/ads/entities/ad.entity';
import { AuditLog } from 'src/audit-logs/entities/audit-log.entity';
import { SearchLog } from 'src/search-logs/entities/search-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        Place, Merchant, Kiosk, Ad, AuditLog, SearchLog
    ])],
    controllers: [DashboardController],
    providers: [DashboardService]
})
export class DashboardModule { }
