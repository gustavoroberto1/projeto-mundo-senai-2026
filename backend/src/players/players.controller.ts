import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { IdentifyPlayerDto } from './dto/identify-player.dto';

@ApiTags('players')
@Controller('api/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post('identify')
  @ApiOperation({
    summary: 'Busca um jogador pelo nickname ou cria um novo caso não exista.',
  })
  async identify(@Body() dto: IdentifyPlayerDto) {
    return this.playersService.identify(dto.nickname);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta os dados de um jogador.' })
  async findById(@Param('id') id: string) {
    return this.playersService.findById(id);
  }

  @Get(':id/records')
  @ApiOperation({
    summary: 'Consulta o melhor resultado do jogador em cada jogo.',
  })
  async getRecords(@Param('id') id: string) {
    return this.playersService.getRecords(id);
  }
}
