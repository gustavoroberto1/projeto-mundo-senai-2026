import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const games = await this.prisma.game.findMany({ where: { active: true } });
    const totalMatches = await this.prisma.gameScore.count();
    const totalPlayers = await this.prisma.player.count();

    const matchesByGame = await Promise.all(
      games.map(async (game) => ({
        gameId: game.id,
        gameName: game.name,
        totalMatches: await this.prisma.gameScore.count({ where: { gameId: game.id } }),
      })),
    );

    const allScores = await this.prisma.gameScore.findMany({
      select: { playerId: true, gameId: true },
    });
    const gamesByPlayer = new Map<string, Set<string>>();
    for (const s of allScores) {
      if (!gamesByPlayer.has(s.playerId)) {
        gamesByPlayer.set(s.playerId, new Set());
      }
      gamesByPlayer.get(s.playerId)!.add(s.gameId);
    }
    const totalGames = games.length;
    const playersWithAllGames = [...gamesByPlayer.values()].filter(
      (set) => set.size >= totalGames,
    ).length;

    return {
      totalUniquePlayers: totalPlayers,
      totalMatches,
      matchesByGame,
      playersWithAllGames,
    };
  }

  async getRankings(limit = 10) {
    const games = await this.prisma.game.findMany({ where: { active: true }, orderBy: { name: 'asc' } });

    const rankings = await Promise.all(
      games.map(async (game) => {
        const scores = await this.prisma.gameScore.findMany({
          where: { gameId: game.id },
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

        const top = [...bestByPlayer.values()]
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

        return { gameId: game.id, gameName: game.name, top };
      }),
    );

    return rankings;
  }

  async getRecentScores(limit = 20) {
    const scores = await this.prisma.gameScore.findMany({
      include: { player: true, game: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return scores.map((s) => ({
      id: s.id,
      nickname: s.player.nickname,
      gameId: s.gameId,
      gameName: s.game.name,
      score: s.score,
      duration: s.duration,
      createdAt: s.createdAt,
    }));
  }
}
