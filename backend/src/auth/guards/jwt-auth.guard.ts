
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface SessionPayload {
  sub: string;
  correo: string;
  rol: string;
  tipo: 'SESION';
}

export interface SessionRequest {
  headers: {
    authorization?: string;
  };
  user?: SessionPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (esPublica) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<SessionRequest>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Se requiere iniciar sesión.',
      );
    }

    const [tipo, token] = authorization.split(' ');

    if (
      tipo?.toLowerCase() !== 'bearer' ||
      !token
    ) {
      throw new UnauthorizedException(
        'Formato de autorización inválido.',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<SessionPayload>(
          token,
          {
            issuer: 'MOTPI-SESSION',
            algorithms: ['HS256'],
          },
        );

      if (
        !payload.sub ||
        !payload.correo ||
        !payload.rol ||
        payload.tipo !== 'SESION'
      ) {
        throw new UnauthorizedException(
          'El token no corresponde a una sesión válida.',
        );
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Sesión inválida o expirada.',
      );
    }
  }
}
