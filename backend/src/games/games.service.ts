import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.game.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) {
      throw new NotFoundException('Jogo não encontrado.');
    }
    return game;
  }

  async getLeaderboard(id: string, limit = 10) {
    await this.findById(id);

    const scores = await this.prisma.gameScore.findMany({
      where: { gameId: id },
      include: { player: true },
      orderBy: { score: 'desc' },
    });

    const bestByPlayer = new Map<string, (typeof scores)[number]>();
    for (const score of scores) {
      const current = bestByPlayer.get(score.playerId);
      if (!current || score.score > current.score) {
        bestByPlayer.set(score.playerId, score);
      }
    }

    return [...bestByPlayer.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s, index) => ({
        rank: index + 1,
        playerId: s.playerId,
        nickname: s.player.nickname,
        score: s.score,
        duration: s.duration,
        achievedAt: s.createdAt,
      }));
  }
}
