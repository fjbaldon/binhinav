import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { Ad } from './entities/ad.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Ad]), AuthModule],
    controllers: [AdsController],
    providers: [AdsService],
})
export class AdsModule { }
