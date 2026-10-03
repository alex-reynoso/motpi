import { Injectable } from '@nestjs/common';
import {
  Accion,
  CondicionAcademica,
  EvaluateAccessDto,
  TipoRecurso,
} from './dto/evaluate-access.dto';

export type Decision = 'PERMITIDO' | 'DENEGADO';

export interface EvaluationResult {
  decision: Decision;
  justificacion: string;
}

@Injectable()
export class EngineService {
  /**
   * ================================================================
   * MOTPI - Módulo de Hian
   * ================================================================
   *
   * RESPONSABILIDAD:
   *   Evaluar políticas ABAC.
   *
   * NO RESPONSABILIDADES:
   *   - Generar tokens
   *   - Consumir tokens
   *   - Registrar auditoría
   *   - Manejar HTTP
   *
   * Entrada:
   *   Sujeto + Recurso + Acción + Contexto
   *
   * Salida:
   *   Decision + Justificación
   * ================================================================
   */

  /**
   * Asociación entre tipo de equipo y materia académica.
   *
   * Esta tabla representa una política institucional simplificada.
   * En una implementación futura podría externalizarse a una
   * base de datos o a un Policy Decision Point.
   */
  private readonly recursoMateria: Record<TipoRecurso, string[]> = {
    [TipoRecurso.OSCILOSCOPIO]: ['Sistemas Electrónicos', 'Circuitos'],
    [TipoRecurso.MULTIMETRO]: ['Sistemas Electrónicos', 'Circuitos'],
    [TipoRecurso.FUENTE_VARIABLE]: ['Sistemas Electrónicos', 'Circuitos'],
    [TipoRecurso.GENERADOR_SEÑALES]: [
      'Sistemas Electrónicos',
      'Circuitos',
    ],
  };

  evaluate(dto: EvaluateAccessDto): EvaluationResult {
    // --------------------------------------------------------------
    // Validación conceptual de la acción.
    // --------------------------------------------------------------

    if (dto.accion !== Accion.PRESTAMO) {
      return {
        decision: 'DENEGADO',
        justificacion: 'Acción no autorizada por la política institucional.',
      };
    }

    // --------------------------------------------------------------
    // REGLA 1
    // Condición académica.
    // --------------------------------------------------------------

    if (
      dto.sujeto.condicionAcademica !== CondicionAcademica.REGULAR
    ) {
      return {
        decision: 'DENEGADO',
        justificacion:
          'Condición académica irregular detectada.',
      };
    }

    // --------------------------------------------------------------
    // REGLA 2
    // Horario del laboratorio.
    //
    // Se interpreta el intervalo como:
    //
    // 08:00 <= hora <= 18:00
    // --------------------------------------------------------------

    const minutosSolicitud = this.convertirHoraAMinutos(
      dto.contexto.horaSolicitud,
    );

    const inicioLaboratorio = 8 * 60;
    const finLaboratorio = 18 * 60;

    if (
      minutosSolicitud < inicioLaboratorio ||
      minutosSolicitud > finLaboratorio
    ) {
      return {
        decision: 'DENEGADO',
        justificacion:
          'Solicitud fuera del horario de atención del laboratorio.',
      };
    }

    // --------------------------------------------------------------
    // REGLA 3
    // Materia asociada al recurso.
    // --------------------------------------------------------------

    const materiasPermitidas =
      this.recursoMateria[dto.recurso.tipo] ?? [];

    const estaInscrito = dto.sujeto.materiasInscritas.some(
      (materia) =>
        materiasPermitidas.some(
          (permitida) =>
            permitida.toLowerCase() === materia.toLowerCase(),
        ),
    );

    if (!estaInscrito) {
      return {
        decision: 'DENEGADO',
        justificacion:
          'El estudiante no está inscrito en la materia vinculada al recurso.',
      };
    }

    // --------------------------------------------------------------
    // Validación adicional contextual:
    // la materia declarada en el contexto debe corresponder con
    // una materia que el estudiante está cursando.
    // --------------------------------------------------------------

    const materiaActualInscrita =
      dto.sujeto.materiasInscritas.some(
        (materia) =>
          materia.toLowerCase() ===
          dto.contexto.materiaActual.toLowerCase(),
      );

    if (!materiaActualInscrita) {
      return {
        decision: 'DENEGADO',
        justificacion:
          'El estudiante no está inscrito en la materia vinculada al recurso.',
      };
    }

    // --------------------------------------------------------------
    // Todas las reglas fueron satisfechas.
    // --------------------------------------------------------------

    return {
      decision: 'PERMITIDO',
      justificacion:
        'Solicitud autorizada: El sujeto cumple con la materia, horario y condición académica requerida.',
    };
  }

  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);

    return horas * 60 + minutos;
  }
}