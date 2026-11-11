import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Indicadores gerais do evento.' })
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Rankings (top jogadores) de cada jogo.' })
  async getRankings(@Query('limit') limit?: string) {
    return this.dashboardService.getRankings(limit ? Number(limit) : 10);
  }

  @Get('recent-scores')
  @ApiOperation({ summary: 'Últimas partidas realizadas.' })
  async getRecentScores(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentScores(limit ? Number(limit) : 20);
  }
}
