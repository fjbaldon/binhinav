import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

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
     * Finds audit log entries based on given criteria.
     * This will be used by the controller to show logs to the admin.
     */
    async find(options?: FindManyOptions<AuditLog>): Promise<AuditLog[]> {
        return this.auditLogRepository.find(options);
    }
}
