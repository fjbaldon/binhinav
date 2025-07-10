import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../admins/entities/admin.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class SeedingService implements OnModuleInit {
    private readonly logger = new Logger(SeedingService.name);

    constructor(
        @InjectRepository(Admin)
        private readonly adminRepository: Repository<Admin>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
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
            await this.adminRepository.save({
                username: 'binhitech_admin', // Use an env variable for this in production
                password: 'supersecretpassword', // And definitely for this!
            });
        }
    }

    private async seedCategories() {
        const categoryCount = await this.categoryRepository.count();
        if (categoryCount === 0) {
            this.logger.log('No categories found. Seeding initial categories...');
            const defaultCategories = [
                { name: 'General Merchandise', iconKey: 'FaStore' },
                { name: 'Food & Beverage', iconKey: 'IoFastFood' },
                { name: 'Apparel & Accessories', iconKey: 'IoShirt' },
                { name: 'Home & Garden', iconKey: 'FaHome' },
                { name: 'Electronics & Technology', iconKey: 'MdPhoneIphone' },
                { name: 'Health & Beauty', iconKey: 'FaHeartbeat' },
                { name: 'Books, Music & Entertainment', iconKey: 'FaMusic' },
                { name: 'Automotive & Industrial', iconKey: 'FaCar' },
                { name: 'Specialty & Niche Stores', iconKey: 'FaStar' },
                { name: 'Services', iconKey: 'FaConciergeBell' },
            ];
            await this.categoryRepository.save(defaultCategories);
        }
    }
}
