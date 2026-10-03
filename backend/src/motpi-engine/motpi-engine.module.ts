import { Module } from '@nestjs/common';

import { EngineController } from './engine.controller';

import { EngineService } from './engine.service';
import { TokenAuditService } from './token-audit.service';

@Module({
  controllers: [EngineController],
  providers: [
    EngineService,
    TokenAuditService,
  ],
  exports: [
    EngineService,
    TokenAuditService,
  ],
})
export class MotpiEngineModule {}