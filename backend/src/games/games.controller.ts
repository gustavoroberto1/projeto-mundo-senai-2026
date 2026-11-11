import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';

@ApiTags('games')
@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os jogos disponíveis.' })
  async findAll() {
    return this.gamesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta informações de um jogo.' })
  async findById(@Param('id') id: string) {
    return this.gamesService.findById(id);
  }

  @Get(':id/leaderboard')
  @ApiOperation({
    summary: 'Consulta o ranking do jogo (melhor resultado de cada jogador).',
  })
  async getLeaderboard(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.gamesService.getLeaderboard(id, limit ? Number(limit) : 10);
  }
}
