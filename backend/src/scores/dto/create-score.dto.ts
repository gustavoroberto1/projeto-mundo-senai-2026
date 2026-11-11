import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class CreateScoreDto {
  @ApiProperty({ example: 'HUMANS_VS_IA' })
  @IsString()
  gameId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  playerId: string;

  @ApiProperty({ example: 2500 })
  @IsInt()
  @Min(0)
  score: number;

  @ApiProperty({ example: 180, description: 'Duração da partida em segundos' })
  @IsInt()
  @Min(0)
  duration: number;
}
