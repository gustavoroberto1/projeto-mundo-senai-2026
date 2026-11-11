-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "nicknameNormalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_scores" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_nicknameNormalized_key" ON "players"("nicknameNormalized");

-- CreateIndex
CREATE INDEX "game_scores_gameId_score_idx" ON "game_scores"("gameId", "score");

-- CreateIndex
CREATE INDEX "game_scores_playerId_gameId_idx" ON "game_scores"("playerId", "gameId");

-- CreateIndex
CREATE INDEX "game_scores_createdAt_idx" ON "game_scores"("createdAt");

-- AddForeignKey
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
