import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

export type TokenStatus = 'ISSUED' | 'CONSUMED';

export interface TokenRecord {
  jti: string;
  status: TokenStatus;
  issuedAt: string;
  consumedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  sujetoId: string;
  recurso: string;
  decision: 'PERMITIDO' | 'DENEGADO';
  justificacion: string;
  jti: string | null;
}

@Injectable()
export class TokenAuditService {
  /**
   * ================================================================
   * MOTPI - Módulo de Alejandro
   * ================================================================
   *
   * RESPONSABILIDAD:
   *   - Lifecycle de tokens
   *   - jti
   *   - Protección contra Replay
   *   - Auditoría
   *
   * NO RESPONSABILIDADES:
   *   - Evaluar políticas
   *   - Decidir PERMITIDO/DENEGADO
   *
   * El motor Hian decide.
   * Alejandro registra y controla el uso posterior de la decisión.
   * ================================================================
   */

  private readonly tokens = new Map<string, TokenRecord>();

  private readonly auditLogs: AuditLog[] = [];

  /**
   * Emite un identificador único de uso para una decisión permitida.
   */
  issueToken(): string {
    const jti = randomUUID();

    this.tokens.set(jti, {
      jti,
      status: 'ISSUED',
      issuedAt: new Date().toISOString(),
    });

    return jti;
  }

  /**
   * Consume un token de forma atómica desde la perspectiva del
   * event loop de Node.js.
   *
   * IMPORTANTE:
   *
   * No existe ningún `await` entre:
   *
   *   1. consultar estado
   *   2. cambiar estado
   *
   * Por tanto, dos requests que entren al mismo proceso no pueden
   * intercalarse entre estas dos operaciones síncronas.
   */
  consumeToken(jti: string): {
    success: boolean;
    jti: string;
    status: TokenStatus;
    consumedAt: string;
  } {
    const token = this.tokens.get(jti);

    if (!token || token.status !== 'ISSUED') {
      throw new BadRequestException(
        'Token inválido, expirado o ya reutilizado (Replay Attack Detectado)',
      );
    }

    // Cambio de estado inmediato y síncrono.
    token.status = 'CONSUMED';
    token.consumedAt = new Date().toISOString();

    return {
      success: true,
      jti,
      status: token.status,
      consumedAt: token.consumedAt,
    };
  }

  /**
   * Registra una decisión completa.
   */
  logDecision(data: {
    sujetoId: string;
    recurso: string;
    decision: 'PERMITIDO' | 'DENEGADO';
    justificacion: string;
    jti?: string | null;
  }): AuditLog {
    const log: AuditLog = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      sujetoId: data.sujetoId,
      recurso: data.recurso,
      decision: data.decision,
      justificacion: data.justificacion,
      jti: data.jti ?? null,
    };

    this.auditLogs.push(log);

    return log;
  }

  /**
   * Devuelve una copia para evitar que el controller pueda modificar
   * accidentalmente el array interno.
   */
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * Útil para depuración del prototipo.
   */
  getToken(jti: string): TokenRecord | undefined {
    return this.tokens.get(jti);
  }
}