import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from 'src/admins/entities/admin.entity';
import { Category } from 'src/categories/entities/category.entity';
import { SeedingService } from './seeding.service';

@Module({
    imports: [TypeOrmModule.forFeature([Admin, Category])],
    providers: [SeedingService],
})
export class DatabaseModule { }
