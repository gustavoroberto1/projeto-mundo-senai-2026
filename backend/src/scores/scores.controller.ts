import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';

@ApiTags('scores')
@Controller('api/scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  @ApiOperation({ summary: 'Registra uma nova partida.' })
  async create(@Body() dto: CreateScoreDto) {
    return this.scoresService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Consulta partidas registradas, com filtros e paginação.' })
  async findMany(
    @Query('gameId') gameId?: string,
    @Query('playerId') playerId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.scoresService.findMany({
      gameId,
      playerId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
