
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Usuario } from '../usuarios/entities/usuarios.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([Usuario]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(
          'AUTH_JWT_SECRET',
        ),
        signOptions: {
          expiresIn: '8h',
          issuer: 'MOTPI-SESSION',
          algorithm: 'HS256',
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

    // Guards globales: se aplican a todos los controladores.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],

  exports: [AuthService],
})
export class AuthModule {}
