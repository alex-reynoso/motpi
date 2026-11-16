
import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { EvaluateAccessDto } from './dto/evaluate-access.dto';
import { ConsumeTokenDto } from './dto/consume-token.dto';

import { EngineService } from './engine.service';
import { TokenAuditService } from './token-audit.service';

import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/motpi')
export class EngineController {
  constructor(
    private readonly engineService: EngineService,
    private readonly tokenAuditService: TokenAuditService,
  ) {}

  @Roles(
    'ADMINISTRADOR_SISTEMA',
    'ENCARGADO_LABORATORIO',
  )
  @Post('evaluate')
  evaluate(@Body() dto: EvaluateAccessDto) {
    const result = this.engineService.evaluate(dto);

    return {
      success: true,
      decision: result.decision,
      justificacion: result.justificacion,
    };
  }

  // El JTI es la credencial de esta operación.
  // No requiere el JWT de sesión.
  @Public()
  @Post('consume-token')
  consumeToken(@Body() dto: ConsumeTokenDto) {
    return this.tokenAuditService.consumeToken(dto.token);
  }
}
