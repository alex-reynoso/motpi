
import {
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsUUID,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CrearSolicitudDto {
  @IsUUID()
  id_usuario: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  recursos: string[];

  @IsString()
  @MaxLength(100)
  materiaActual: string;

  @IsDateString()
  fechaDevolucionPrevista: string;
}
