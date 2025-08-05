import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../admins/entities/admin.entity';
import { Category } from '../categories/entities/category.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeedingService implements OnModuleInit {
    private readonly logger = new Logger(SeedingService.name);

    constructor(
        @InjectRepository(Admin)
        private readonly adminRepository: Repository<Admin>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        this.logger.log('Starting database seeding...');
        await this.seedAdmins();
        await this.seedCategories();
        this.logger.log('Database seeding finished.');
    }

    private async seedAdmins() {
        const adminCount = await this.adminRepository.count();
        if (adminCount === 0) {
            this.logger.log('No admins found. Seeding initial admin...');

            const newAdmin = this.adminRepository.create({
                name: 'Default Admin',
                email: 'admin@example.com',
                username: this.configService.get<string>('SEED_ADMIN_USERNAME'),
                password: this.configService.get<string>('SEED_ADMIN_PASSWORD'),
            });

            await this.adminRepository.save(newAdmin);
        }
    }

    private async seedCategories() {
        const categoryCount = await this.categoryRepository.count();
        if (categoryCount === 0) {
            this.logger.log('No categories found. Seeding initial categories...');
            const defaultCategories = [
                { name: 'General Merchandise', iconKey: 'Store' },
                { name: 'Food & Beverage', iconKey: 'Utensils' },
                { name: 'Apparel & Accessories', iconKey: 'Shirt' },
                { name: 'Home & Garden', iconKey: 'Home' },
                { name: 'Electronics & Technology', iconKey: 'Smartphone' },
                { name: 'Health & Beauty', iconKey: 'HeartPulse' },
                { name: 'Books, Music & Entertainment', iconKey: 'Music' },
                { name: 'Automotive & Industrial', iconKey: 'Car' },
                { name: 'Specialty & Niche Stores', iconKey: 'Star' },
                { name: 'Services', iconKey: 'ConciergeBell' },
            ];
            await this.categoryRepository.save(defaultCategories);
        }
    }
}
