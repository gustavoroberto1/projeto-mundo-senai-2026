import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class IdentifyPlayerDto {
  @ApiProperty({ example: 'Neo', minLength: 2, maxLength: 20 })
  @IsString()
  @Length(2, 20)
  nickname: string;
}
