import { Controller, Get, UseGuards, Query, DefaultValuePipe, ParseBoolPipe, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    getDashboardData() {
        return this.dashboardService.getDashboardData();
    }

    @Get('search-terms')
    getTopSearchTerms(
        @Query('withResults', ParseBoolPipe) withResults: boolean,
        @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    ) {
        return this.dashboardService.getTopSearchTerms(withResults, limit);
    }
}
