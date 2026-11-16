import {
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsNumber,
  IsObject,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CondicionAcademica {
  REGULAR = 'REGULAR',
  IRREGULAR = 'IRREGULAR',
}

export enum TipoRecurso {
  OSCILOSCOPIO = 'OSCILOSCOPIO',
  MULTIMETRO = 'MULTIMETRO',
  FUENTE_VARIABLE = 'FUENTE_VARIABLE',
  GENERADOR_SEÑALES = 'GENERADOR_SEÑALES',
}

export enum Accion {
  PRESTAMO = 'PRESTAMO',
}

export class SujetoDto {
  @IsString()
  id: string;

  @IsString()
  rol: string;

  @IsIn(Object.values(CondicionAcademica))
  condicionAcademica: CondicionAcademica;

  @IsArray()
  @IsString({ each: true })
  materiasInscritas: string[];
}

export class RecursoDto {
  @IsString()
  id: string;

  @IsIn(Object.values(TipoRecurso))
  tipo: TipoRecurso;
}

export class ContextoDto {
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horaSolicitud debe tener formato HH:MM',
  })
  horaSolicitud: string;

  @IsNumber()
  @IsIn([1, 2, 3, 4, 5, 6, 7])
  diaSemana: number;

  @IsString()
  materiaActual: string;
}

export class EvaluateAccessDto {
  @ValidateNested()
  @Type(() => SujetoDto)
  sujeto: SujetoDto;

  @ValidateNested()
  @Type(() => RecursoDto)
  recurso: RecursoDto;

  @IsIn(Object.values(Accion))
  accion: Accion;

  @ValidateNested()
  @Type(() => ContextoDto)
  contexto: ContextoDto;
}

export class EvaluateMultipleAccessDto {
  @ValidateNested()
  @Type(() => SujetoDto)
  sujeto: SujetoDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RecursoDto)
  recursos: RecursoDto[];

  @IsIn(Object.values(Accion))
  accion: Accion;

  @ValidateNested()
  @Type(() => ContextoDto)
  contexto: ContextoDto;
}