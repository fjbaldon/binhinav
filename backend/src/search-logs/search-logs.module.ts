import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchLogsService } from './search-logs.service';
import { SearchLogsController } from './search-logs.controller';
import { SearchLog } from './entities/search-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SearchLog])],
    controllers: [SearchLogsController],
    providers: [SearchLogsService],
    exports: [SearchLogsService]
})
export class SearchLogsModule { }
