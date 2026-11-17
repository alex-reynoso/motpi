
import {
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsUUID,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CrearSolicitudDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  recursos: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  materiaActual: string;

  @IsDateString()
  fechaDevolucionPrevista: string;
}
