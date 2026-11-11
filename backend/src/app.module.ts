import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { PlayersModule } from './players/players.module';
import { GamesModule } from './games/games.module';
import { ScoresModule } from './scores/scores.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend'),
      exclude: ['/api/(.*)'],
    }),
    PrismaModule,
    PlayersModule,
    GamesModule,
    ScoresModule,
    DashboardModule,
    EventsModule,
  ],
})
export class AppModule {}
