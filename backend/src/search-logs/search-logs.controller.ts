import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchLogsService } from './search-logs.service';
import { CreateSelectionLogDto } from './dto/create-search-log.dto';

@Controller('search-logs')
export class SearchLogsController {
    constructor(private readonly searchLogsService: SearchLogsService) { }

    @Post('select')
    @HttpCode(HttpStatus.NO_CONTENT)
    logSelection(@Body() createSelectionLogDto: CreateSelectionLogDto) {
        this.searchLogsService.createSelectionLog(createSelectionLogDto);
    }
}
