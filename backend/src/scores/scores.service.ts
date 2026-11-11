import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateScoreDto } from './dto/create-score.dto';

@Injectable()
export class ScoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async create(dto: CreateScoreDto) {
    const [player, game] = await Promise.all([
      this.prisma.player.findUnique({ where: { id: dto.playerId } }),
      this.prisma.game.findUnique({ where: { id: dto.gameId } }),
    ]);

    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    if (!game) {
      throw new BadRequestException('Jogo não encontrado.');
    }

    const previousBest = await this.prisma.gameScore.findFirst({
      where: { playerId: dto.playerId, gameId: dto.gameId },
      orderBy: { score: 'desc' },
    });

    const scoreRecord = await this.prisma.gameScore.create({
      data: {
        playerId: dto.playerId,
        gameId: dto.gameId,
        score: dto.score,
        duration: dto.duration,
      },
    });

    const isNewRecord = !previousBest || scoreRecord.score > previousBest.score;

    const payload = {
      id: scoreRecord.id,
      playerId: player.id,
      nickname: player.nickname,
      gameId: game.id,
      gameName: game.name,
      score: scoreRecord.score,
      duration: scoreRecord.duration,
      createdAt: scoreRecord.createdAt,
      isNewRecord,
    };

    this.events.emitScoreCreated(payload);
    if (isNewRecord) {
      this.events.emitRecordUpdated(payload);
    }

    return payload;
  }

  async findMany(params: { gameId?: string; playerId?: string; page?: number; pageSize?: number }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20;

    const where = {
      ...(params.gameId ? { gameId: params.gameId } : {}),
      ...(params.playerId ? { playerId: params.playerId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.gameScore.findMany({
        where,
        include: { player: true, game: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.gameScore.count({ where }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: items.map((s) => ({
        id: s.id,
        playerId: s.playerId,
        nickname: s.player.nickname,
        gameId: s.gameId,
        gameName: s.game.name,
        score: s.score,
        duration: s.duration,
        createdAt: s.createdAt,
      })),
    };
  }
}
