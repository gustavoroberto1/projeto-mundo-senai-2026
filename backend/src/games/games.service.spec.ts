import { Test } from '@nestjs/testing';
import { GamesService } from './games.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GamesService', () => {
  let service: GamesService;
  const prismaMock = {
    game: { findMany: jest.fn(), findUnique: jest.fn() },
    gameScore: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [GamesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(GamesService);
  });

  describe('getLeaderboard', () => {
    it('ranks only each player\'s best score, highest first', async () => {
      prismaMock.game.findUnique.mockResolvedValue({ id: 'LIMBO' });
      prismaMock.gameScore.findMany.mockResolvedValue([
        { playerId: 'p1', score: 100, duration: 10, createdAt: new Date(), player: { nickname: 'Neo' } },
        { playerId: 'p1', score: 400, duration: 15, createdAt: new Date(), player: { nickname: 'Neo' } },
        { playerId: 'p2', score: 250, duration: 20, createdAt: new Date(), player: { nickname: 'Trinity' } },
      ]);

      const leaderboard = await service.getLeaderboard('LIMBO');

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0]).toMatchObject({ rank: 1, nickname: 'Neo', score: 400 });
      expect(leaderboard[1]).toMatchObject({ rank: 2, nickname: 'Trinity', score: 250 });
    });
  });
});
