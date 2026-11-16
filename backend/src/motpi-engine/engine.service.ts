import { Injectable } from '@nestjs/common';
import {
  Accion,
  CondicionAcademica,
  EvaluateAccessDto,
  EvaluateMultipleAccessDto,
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
    // Validación de la acción.
    if (dto.accion !== Accion.PRESTAMO) {
      return {
        decision: 'DENEGADO',
        justificacion: 'Acción no autorizada por la política institucional.',
      };
    }

    // REGLA 1: Condición académica.
    if (dto.sujeto.condicionAcademica !== CondicionAcademica.REGULAR) {
      return {
        decision: 'DENEGADO',
        justificacion: 'Condición académica irregular detectada.',
      };
    }

    // REGLA 2: Horario del laboratorio.
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

    // REGLA 3: Materia asociada al recurso.
    const materiasPermitidas =
      this.recursoMateria[dto.recurso.tipo] ?? [];

    const estaInscrito = dto.sujeto.materiasInscritas.some((materia) =>
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

    // Validación adicional: materia actual inscrita.
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

    // Todas las reglas fueron satisfechas.
    return {
      decision: 'PERMITIDO',
      justificacion:
        'Solicitud autorizada: El sujeto cumple con la materia, horario y condición académica requerida.',
    };
  }

  evaluateMultiple(
    dto: EvaluateMultipleAccessDto,
  ): EvaluationResult & {
    resultados: {
      recursoId: string;
      decision: Decision;
      justificacion: string;
    }[];
  } {
    const resultados = dto.recursos.map((recurso) => {
      const resultado = this.evaluate({
        sujeto: dto.sujeto,
        recurso,
        accion: dto.accion,
        contexto: dto.contexto,
      });

      return {
        recursoId: recurso.id,
        decision: resultado.decision,
        justificacion: resultado.justificacion,
      };
    });

    const recursosDenegados = resultados.filter(
      (resultado) => resultado.decision === 'DENEGADO',
    );

    if (recursosDenegados.length > 0) {
      return {
        decision: 'DENEGADO',
        justificacion: recursosDenegados
          .map(
            (resultado) =>
              `Equipo ${resultado.recursoId}: ${resultado.justificacion}`,
          )
          .join(' | '),
        resultados,
      };
    }

    return {
      decision: 'PERMITIDO',
      justificacion:
        'Todos los equipos cumplen las políticas institucionales de autorización.',
      resultados,
    };
  }

  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }
} 