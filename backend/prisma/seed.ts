import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const games = [
  {
    id: "HUMANS_VS_IA",
    name: "Humans vs IA",
    description: "Defenda sua base contra a invasão.",
  },
  {
    id: "TOMB_OF_THE_MASK",
    name: "Run Frog",
    description: "Corra, colete e escape do labirinto.",
  },
  {
    id: "LIMBO",
    name: "Limbo",
    description: "Atravesse um mundo cheio de mistérios.",
  },
  {
    id: "LEVEL_DEVIL",
    name: "Troll Cat",
    description: "Nunca confie no chão sob seus pés.",
  },
];

async function main() {
  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: { name: game.name, description: game.description },
      create: { ...game, active: true },
    });
  }

  console.log("Seed concluído: jogos e pontuações fictícias criados.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
