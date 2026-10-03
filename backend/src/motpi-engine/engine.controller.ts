import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { EvaluateAccessDto } from './dto/evaluate-access.dto';
import { ConsumeTokenDto } from './dto/consume-token.dto';

import {
  EngineService,
  EvaluationResult,
} from './engine.service';

import { TokenAuditService } from './token-audit.service';

@Controller('api/v1/motpi')
export class EngineController {
  constructor(
    private readonly engineService: EngineService,
    private readonly tokenAuditService: TokenAuditService,
  ) {}

  /**
   * Evalúa una solicitud de préstamo.
   *
   * Flujo:
   *
   * HTTP
   *  ↓
   * EngineService / Hian
   *  ↓
   * Decision
   *  ↓
   * TokenAuditService / Alejandro
   *  ↓
   * Auditoría
   */
  @Post('evaluate')
  evaluate(@Body() dto: EvaluateAccessDto) {
    const result: EvaluationResult =
      this.engineService.evaluate(dto);

    let jti: string | null = null;
    let tokenMock: string | null = null;

    if (result.decision === 'PERMITIDO') {
      jti = this.tokenAuditService.issueToken();

      tokenMock = this.createMockToken({
        jti,
        sujetoId: dto.sujeto.id,
        recurso: dto.recurso.id,
        accion: dto.accion,
      });
    }

    const auditLog = this.tokenAuditService.logDecision({
      sujetoId: dto.sujeto.id,
      recurso: dto.recurso.id,
      decision: result.decision,
      justificacion: result.justificacion,
      jti,
    });

    return {
      success: true,
      decision: result.decision,
      justificacion: result.justificacion,
      jti,
      token: tokenMock,
      auditId: auditLog.id,
      timestamp: auditLog.timestamp,
    };
  }

  /**
   * Consume un token de uso único.
   */
  @Post('consume-token')
  consumeToken(@Body() dto: ConsumeTokenDto) {
    return this.tokenAuditService.consumeToken(dto.jti);
  }

  /**
   * Obtiene la trazabilidad completa.
   */
  @Get('audit-logs')
  getAuditLogs() {
    return {
      success: true,
      total: this.tokenAuditService.getAuditLogs().length,
      logs: this.tokenAuditService.getAuditLogs(),
    };
  }

  /**
   * Token MOCK.
   *
   * No pretende ser un JWT criptográficamente válido.
   * Su finalidad es mostrar cómo una decisión autorizada podría
   * transportar el jti hacia el consumidor.
   */
  private createMockToken(data: {
    jti: string;
    sujetoId: string;
    recurso: string;
    accion: string;
  }): string {
    const header = {
      alg: 'none',
      typ: 'MOTPI-MOCK',
    };

    const payload = {
      iss: 'MOTPI',
      jti: data.jti,
      sub: data.sujetoId,
      resource: data.recurso,
      action: data.accion,
      issuedAt: new Date().toISOString(),
    };

    return [
      this.base64Url(JSON.stringify(header)),
      this.base64Url(JSON.stringify(payload)),
      'MOCK_SIGNATURE',
    ].join('.');
  }

  private base64Url(value: string): string {
    return Buffer.from(value)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}