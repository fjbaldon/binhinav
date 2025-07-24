import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ad } from 'src/ads/entities/ad.entity';
import { AuditLog } from 'src/audit-logs/entities/audit-log.entity';
import { Kiosk } from 'src/kiosks/entities/kiosk.entity';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { Place } from 'src/places/entities/place.entity';
import { SearchLog } from 'src/search-logs/entities/search-log.entity';
import { Repository } from 'typeorm';
import { subDays } from 'date-fns';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Place) private readonly placeRepository: Repository<Place>,
        @InjectRepository(Merchant) private readonly merchantRepository: Repository<Merchant>,
        @InjectRepository(Kiosk) private readonly kioskRepository: Repository<Kiosk>,
        @InjectRepository(Ad) private readonly adRepository: Repository<Ad>,
        @InjectRepository(AuditLog) private readonly auditLogRepository: Repository<AuditLog>,
        @InjectRepository(SearchLog) private readonly searchLogRepository: Repository<SearchLog>,
    ) { }

    async getDashboardData() {
        const [
            kpiData,
            topSearchedPlaces,
            topSearchTerms,
            topNotFoundTerms,
            categoryPopularity,
            operationalSnapshot
        ] = await Promise.all([
            this.getKpiData(),
            this.getTopSearchedPlaces(),
            this.getTopSearchTerms(true),
            this.getTopSearchTerms(false),
            this.getCategoryPopularity(),
            this.getOperationalSnapshot()
        ]);

        return {
            kpiData,
            topSearchedPlaces,
            topSearchTerms,
            topNotFoundTerms,
            categoryPopularity,
            operationalSnapshot
        };
    }

    private async getKpiData() {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const [places, merchants, kiosks, searches30Days] = await Promise.all([
            this.placeRepository.count(),
            this.merchantRepository.count(),
            this.kioskRepository.count(),
            this.searchLogRepository.createQueryBuilder("log")
                .where("log.timestamp > :thirtyDaysAgo", { thirtyDaysAgo })
                .getCount(),
        ]);

        return { places, merchants, kiosks, searches30Days };
    }

    private async getTopSearchedPlaces() {
        return this.searchLogRepository.createQueryBuilder('log')
            .select('place.name', 'name')
            .addSelect('COUNT(log.id)', 'count')
            .innerJoin('log.selectedPlace', 'place')
            .where('log.selectedPlace IS NOT NULL')
            .groupBy('place.name')
            .orderBy('count', 'DESC')
            .limit(5)
            .getRawMany();
    }

    private async getTopSearchTerms(withResults: boolean) {
        return this.searchLogRepository.createQueryBuilder('log')
            .select('log.searchTerm', 'term')
            .addSelect('COUNT(log.id)', 'count')
            .where({ foundResults: withResults })
            .groupBy('log.searchTerm')
            .orderBy('count', 'DESC')
            .limit(5)
            .getRawMany();
    }

    private async getCategoryPopularity() {
        return this.searchLogRepository.createQueryBuilder('log')
            .select('category.name', 'name')
            .addSelect('COUNT(*)', 'count')
            .innerJoin('log.selectedPlace', 'place')
            .innerJoin('place.category', 'category')
            .where('log.selectedPlaceId IS NOT NULL')
            .groupBy('category.name')
            .orderBy('count', 'DESC')
            .getRawMany();
    }

    private async getOperationalSnapshot() {
        const [unassignedMerchants, latestChange, inactiveAds] = await Promise.all([
            this.merchantRepository.createQueryBuilder("merchant")
                .leftJoin("merchant.place", "place")
                .where("place.id IS NULL")
                .getCount(),
            this.auditLogRepository.createQueryBuilder("log")
                .orderBy("log.timestamp", "DESC")
                .limit(1)
                .getOne(),
            this.adRepository.createQueryBuilder("ad")
                .where("ad.isActive = :isActive", { isActive: false })
                .getCount(),
        ]);

        return { unassignedMerchants, latestChange, inactiveAds };
    }
}
