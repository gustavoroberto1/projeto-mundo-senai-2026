import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async identify(nickname: string) {
    const trimmed = nickname.trim();
    const nicknameNormalized = trimmed.toLowerCase();

    const existing = await this.prisma.player.findUnique({
      where: { nicknameNormalized },
    });
    if (existing) {
      return { player: existing, created: false };
    }

    const player = await this.prisma.player.create({
      data: { nickname: trimmed, nicknameNormalized },
    });
    return { player, created: true };
  }

  async findById(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return player;
  }

  async getRecords(id: string) {
    await this.findById(id);

    const games = await this.prisma.game.findMany({ orderBy: { name: 'asc' } });
    const scores = await this.prisma.gameScore.findMany({
      where: { playerId: id },
    });

    return games.map((game) => {
      const gameScores = scores.filter((s) => s.gameId === game.id);
      if (gameScores.length === 0) {
        return {
          gameId: game.id,
          gameName: game.name,
          played: false,
          bestScore: null,
          bestDuration: null,
        };
      }
      const best = gameScores.reduce((max, s) => (s.score > max.score ? s : max));
      return {
        gameId: game.id,
        gameName: game.name,
        played: true,
        bestScore: best.score,
        bestDuration: best.duration,
      };
    });
  }
}
