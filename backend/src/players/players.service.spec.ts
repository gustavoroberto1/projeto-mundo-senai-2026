import { Test } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlayersService', () => {
  let service: PlayersService;
  const prismaMock = {
    player: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    game: {
      findMany: jest.fn(),
    },
    gameScore: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [PlayersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(PlayersService);
  });

  describe('identify', () => {
    it('creates a new player when nickname does not exist, normalizing case/spaces', async () => {
      prismaMock.player.findUnique.mockResolvedValue(null);
      prismaMock.player.create.mockResolvedValue({
        id: '1',
        nickname: 'Neo',
        nicknameNormalized: 'neo',
      });

      const result = await service.identify('  Neo  ');

      expect(prismaMock.player.findUnique).toHaveBeenCalledWith({
        where: { nicknameNormalized: 'neo' },
      });
      expect(prismaMock.player.create).toHaveBeenCalledWith({
        data: { nickname: 'Neo', nicknameNormalized: 'neo' },
      });
      expect(result.created).toBe(true);
      expect(result.player.nickname).toBe('Neo');
    });

    it('returns the existing player without creating a duplicate', async () => {
      const existing = { id: '1', nickname: 'Neo', nicknameNormalized: 'neo' };
      prismaMock.player.findUnique.mockResolvedValue(existing);

      const result = await service.identify('NEO');

      expect(prismaMock.player.create).not.toHaveBeenCalled();
      expect(result.created).toBe(false);
      expect(result.player).toBe(existing);
    });
  });

  describe('getRecords', () => {
    it('returns the best score per game and "not played" for games without scores', async () => {
      prismaMock.player.findUnique.mockResolvedValue({ id: '1', nickname: 'Neo' });
      prismaMock.game.findMany.mockResolvedValue([
        { id: 'LIMBO', name: 'Limbo' },
        { id: 'LEVEL_DEVIL', name: 'Level Devil' },
      ]);
      prismaMock.gameScore.findMany.mockResolvedValue([
        { gameId: 'LIMBO', score: 100, duration: 10 },
        { gameId: 'LIMBO', score: 300, duration: 20 },
      ]);

      const records = await service.getRecords('1');

      expect(records).toEqual([
        { gameId: 'LIMBO', gameName: 'Limbo', played: true, bestScore: 300, bestDuration: 20 },
        {
          gameId: 'LEVEL_DEVIL',
          gameName: 'Level Devil',
          played: false,
          bestScore: null,
          bestDuration: null,
        },
      ]);
    });
  });
});
