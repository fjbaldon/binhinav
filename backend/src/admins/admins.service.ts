import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {

    constructor(
        @InjectRepository(Admin)
        private adminsRepository: Repository<Admin>,
    ) { }

    async findOne(id: string): Promise<Admin> {
        const admin = await this.adminsRepository.findOne({ where: { id } });
        if (!admin) {
            throw new NotFoundException(`Admin with ID "${id}" not found`);
        }
        return admin;
    }

    async findOneByUsername(username: string): Promise<Admin | undefined> {
        const admin = await this.adminsRepository.findOne({ where: { username } });
        return admin ?? undefined;
    }

    async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
        const admin = await this.adminsRepository.preload({
            id: id,
            ...updateAdminDto,
        });
        if (!admin) {
            throw new NotFoundException(`Admin with ID "${id}" not found`);
        }
        return this.adminsRepository.save(admin);
    }
}
