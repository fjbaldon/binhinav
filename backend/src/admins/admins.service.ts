import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';
import { ActionType } from 'src/audit-logs/enums/action-type.enum';

interface UserPayload {
    userId: string;
    username: string;
    role: string;
    isSuperAdmin?: boolean;
}

@Injectable()
export class AdminsService {

    constructor(
        @InjectRepository(Admin)
        private adminsRepository: Repository<Admin>,
        private readonly auditLogsService: AuditLogsService,
    ) { }

    async create(createAdminDto: CreateAdminDto, user: UserPayload): Promise<Admin> {
        const existingByUsername = await this.adminsRepository.findOneBy({ username: createAdminDto.username });
        if (existingByUsername) {
            throw new ConflictException(`Username "${createAdminDto.username}" is already taken.`);
        }
        if (createAdminDto.email) {
            const existingByEmail = await this.adminsRepository.findOneBy({ email: createAdminDto.email });
            if (existingByEmail) {
                throw new ConflictException(`Email "${createAdminDto.email}" is already in use.`);
            }
        }

        const newAdmin = this.adminsRepository.create(createAdminDto);
        const savedAdmin = await this.adminsRepository.save(newAdmin);

        await this.auditLogsService.create({
            entityType: 'Admin', entityId: savedAdmin.id, action: ActionType.CREATE,
            changes: { info: `Admin ${savedAdmin.username} created` },
            userId: user.userId, username: user.username, userRole: user.role,
        });

        return savedAdmin;
    }

    findAll(): Promise<Admin[]> {
        return this.adminsRepository.find();
    }

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

    async update(id: string, updateAdminDto: UpdateAdminDto, user: UserPayload): Promise<Admin> {
        if (updateAdminDto.isSuperAdmin !== undefined && !user.isSuperAdmin) {
            throw new ForbiddenException("Only a Super Admin can change admin roles.");
        }

        const adminBeforeUpdate = await this.findOne(id);
        if (!adminBeforeUpdate) {
            throw new NotFoundException(`Admin with ID "${id}" not found`);
        }

        if (
            adminBeforeUpdate.isSuperAdmin &&
            updateAdminDto.isSuperAdmin === false
        ) {
            const superAdminCount = await this.adminsRepository.countBy({ isSuperAdmin: true });
            if (superAdminCount <= 1) {
                throw new ForbiddenException("Cannot remove the last Super Admin role.");
            }
        }

        if (updateAdminDto.username) {
            const existing = await this.adminsRepository.findOneBy({ username: updateAdminDto.username });
            if (existing && existing.id !== id) {
                throw new ConflictException(`Username "${updateAdminDto.username}" is already taken.`);
            }
        }
        if (updateAdminDto.email) {
            const existing = await this.adminsRepository.findOneBy({ email: updateAdminDto.email });
            if (existing && existing.id !== id) {
                throw new ConflictException(`Email "${updateAdminDto.email}" is already in use.`);
            }
        }

        const admin = await this.adminsRepository.preload({ id: id, ...updateAdminDto });
        if (!admin) {
            throw new NotFoundException(`Admin with ID "${id}" not found`);
        }

        const savedAdmin = await this.adminsRepository.save(admin);

        const changes = Object.keys(updateAdminDto).reduce((acc, key) => {
            if (key !== 'password' && adminBeforeUpdate[key] !== savedAdmin[key]) {
                acc[key] = { from: adminBeforeUpdate[key], to: savedAdmin[key] };
            }
            if (key === 'password' && updateAdminDto.password) {
                acc[key] = { from: 'hidden', to: 'hidden' };
            }
            return acc;
        }, {});

        if (Object.keys(changes).length > 0) {
            await this.auditLogsService.create({
                entityType: 'Admin', entityId: id, action: ActionType.UPDATE,
                changes: changes, userId: user.userId, username: user.username, userRole: user.role,
            });
        }

        return savedAdmin;
    }

    async remove(id: string, user: UserPayload): Promise<void> {
        const adminToDelete = await this.findOne(id);

        if (adminToDelete.isSuperAdmin) {
            const superAdminCount = await this.adminsRepository.countBy({ isSuperAdmin: true });
            if (superAdminCount <= 1) {
                throw new ForbiddenException("Cannot delete the last Super Admin account.");
            }
        }

        const result = await this.adminsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Admin with ID "${id}" not found`);
        }

        await this.auditLogsService.create({
            entityType: 'Admin', entityId: id, action: ActionType.DELETE,
            changes: { info: `Admin ${adminToDelete.username} deleted` },
            userId: user.userId, username: user.username, userRole: user.role,
        });
    }
}
