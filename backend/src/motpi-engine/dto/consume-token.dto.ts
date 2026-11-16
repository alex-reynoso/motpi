
import { IsJWT } from 'class-validator';

export class ConsumeTokenDto {
  @IsJWT()
  token: string;
}
