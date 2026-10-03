import { IsUUID } from 'class-validator';

export class ConsumeTokenDto {
  @IsUUID('4')
  jti: string;
}