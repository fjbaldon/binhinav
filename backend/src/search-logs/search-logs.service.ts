import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SearchLog } from './entities/search-log.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateSelectionLogDto } from './dto/create-search-log.dto';

interface SearchPerformedPayload {
    searchTerm: string;
    foundResults: boolean;
    kioskId?: string;
}

@Injectable()
export class SearchLogsService {
    private readonly logger = new Logger(SearchLogsService.name);

    constructor(
        @InjectRepository(SearchLog)
        private searchLogRepository: Repository<SearchLog>,
    ) { }

    @OnEvent('search.performed', { async: true })
    async handleSearchPerformedEvent(payload: SearchPerformedPayload) {
        try {
            if (!payload.searchTerm) return;

            const newLogData: DeepPartial<SearchLog> = {
                searchTerm: payload.searchTerm.toLowerCase().trim(),
                foundResults: payload.foundResults,
                kiosk: payload.kioskId ? { id: payload.kioskId } : null,
                selectedPlace: null,
            };

            const newLog = this.searchLogRepository.create(newLogData);
            await this.searchLogRepository.save(newLog);
        } catch (error) {
            this.logger.error(`Failed to log search event for term: "${payload.searchTerm}"`, error.stack);
        }
    }

    async createSelectionLog(dto: CreateSelectionLogDto) {
        try {
            const newLogData: DeepPartial<SearchLog> = {
                searchTerm: dto.searchTerm.toLowerCase().trim(),
                foundResults: true,
                kiosk: { id: dto.kioskId },
                selectedPlace: { id: dto.placeId },
            };
            const newLog = this.searchLogRepository.create(newLogData);
            await this.searchLogRepository.save(newLog);
        } catch (error) {
            this.logger.error(`Failed to log selection event for placeId: "${dto.placeId}"`, error.stack);
        }
    }
}
