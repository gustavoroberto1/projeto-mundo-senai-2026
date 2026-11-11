import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const games = [
  {
    id: 'HUMANS_VS_IA',
    name: 'Humans vs IA',
    description: 'Defenda sua base contra a invasão.',
  },
  {
    id: 'TOMB_OF_THE_MASK',
    name: 'Tomb of the Mask',
    description: 'Corra, colete e escape do labirinto.',
  },
  {
    id: 'LIMBO',
    name: 'Limbo',
    description: 'Atravesse um mundo cheio de mistérios.',
  },
  {
    id: 'LEVEL_DEVIL',
    name: 'Level Devil',
    description: 'Nunca confie no chão sob seus pés.',
  },
];

const demoPlayers = ['Neo', 'Trinity', 'Morfeu'];

async function main() {
  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: { name: game.name, description: game.description },
      create: { ...game, active: true },
    });
  }

  for (const nickname of demoPlayers) {
    const nicknameNormalized = nickname.trim().toLowerCase();
    const player = await prisma.player.upsert({
      where: { nicknameNormalized },
      update: {},
      create: { nickname, nicknameNormalized },
    });

    for (const game of games) {
      const plays = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < plays; i++) {
        await prisma.gameScore.create({
          data: {
            playerId: player.id,
            gameId: game.id,
            score: 200 + Math.floor(Math.random() * 4800),
            duration: 30 + Math.floor(Math.random() * 270),
          },
        });
      }
    }
  }

  console.log('Seed concluído: jogos e pontuações fictícias criados.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
