import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { Role } from 'src/shared/enums/role.enum';

@Injectable()
export class AuditLogsService {
    private readonly logger = new Logger(AuditLogsService.name);

    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    /**
     * Creates a new audit log entry. This is a "fire-and-forget" operation.
     * This will be called from other services (e.g., PlacesService).
     */
    async create(createAuditLogDto: CreateAuditLogDto): Promise<void> {
        try {
            const newLog = this.auditLogRepository.create(createAuditLogDto);
            await this.auditLogRepository.save(newLog);
        } catch (error) {
            this.logger.error('Failed to create audit log', error.stack);
        }
    }

    /**
     * Finds the latest 100 audit log entries created by merchants.
     */
    async findMerchantChanges(): Promise<AuditLog[]> {
        return this.auditLogRepository.createQueryBuilder('log')
            .where('log.userRole = :role', { role: Role.Merchant })
            .orderBy('log.timestamp', 'DESC')
            .take(100)
            .getMany();
    }
}
