
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { EngineController } from './engine.controller';
import { EngineService } from './engine.service';
import { TokenAuditService } from './token-audit.service';

import { TokenAutorizacion } from '../prestamos/entities/token-autorizacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenAutorizacion]),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
          issuer: configService.getOrThrow<string>('JWT_ISSUER'),
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  controllers: [EngineController],
  providers: [
    EngineService,
    TokenAuditService,
  ],
  exports: [
    EngineService,
    TokenAuditService,
    JwtModule,
  ],
})
export class MotpiEngineModule {}
