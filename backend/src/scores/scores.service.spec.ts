import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

describe('ScoresService', () => {
  let service: ScoresService;
  const prismaMock = {
    player: { findUnique: jest.fn() },
    game: { findUnique: jest.fn() },
    gameScore: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  };
  const eventsMock = {
    emitScoreCreated: jest.fn(),
    emitRecordUpdated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ScoresService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EventsGateway, useValue: eventsMock },
      ],
    }).compile();
    service = moduleRef.get(ScoresService);
  });

  const dto = { playerId: 'p1', gameId: 'LIMBO', score: 500, duration: 60 };

  it('throws when the player does not exist', async () => {
    prismaMock.player.findUnique.mockResolvedValue(null);
    prismaMock.game.findUnique.mockResolvedValue({ id: 'LIMBO' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when the game does not exist', async () => {
    prismaMock.player.findUnique.mockResolvedValue({ id: 'p1', nickname: 'Neo' });
    prismaMock.game.findUnique.mockResolvedValue(null);

    await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a new match, marks it as a new record and emits both socket events', async () => {
    prismaMock.player.findUnique.mockResolvedValue({ id: 'p1', nickname: 'Neo' });
    prismaMock.game.findUnique.mockResolvedValue({ id: 'LIMBO', name: 'Limbo' });
    prismaMock.gameScore.findFirst.mockResolvedValue({ score: 200 });
    prismaMock.gameScore.create.mockResolvedValue({
      id: 's1',
      score: 500,
      duration: 60,
      createdAt: new Date('2026-01-01'),
    });

    const result = await service.create(dto);

    expect(prismaMock.gameScore.create).toHaveBeenCalledWith({
      data: { playerId: 'p1', gameId: 'LIMBO', score: 500, duration: 60 },
    });
    expect(result.isNewRecord).toBe(true);
    expect(eventsMock.emitScoreCreated).toHaveBeenCalledTimes(1);
    expect(eventsMock.emitRecordUpdated).toHaveBeenCalledTimes(1);
  });

  it('keeps a lower score as a new match but not a new record', async () => {
    prismaMock.player.findUnique.mockResolvedValue({ id: 'p1', nickname: 'Neo' });
    prismaMock.game.findUnique.mockResolvedValue({ id: 'LIMBO', name: 'Limbo' });
    prismaMock.gameScore.findFirst.mockResolvedValue({ score: 900 });
    prismaMock.gameScore.create.mockResolvedValue({
      id: 's2',
      score: 500,
      duration: 60,
      createdAt: new Date('2026-01-01'),
    });

    const result = await service.create(dto);

    expect(result.isNewRecord).toBe(false);
    expect(eventsMock.emitScoreCreated).toHaveBeenCalledTimes(1);
    expect(eventsMock.emitRecordUpdated).not.toHaveBeenCalled();
  });
});
