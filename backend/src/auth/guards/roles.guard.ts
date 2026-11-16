
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { SessionRequest } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const rolesPermitidos =
      this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    // Si no se especifican roles,
    // cualquier usuario autenticado puede acceder.
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<SessionRequest>();

    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException(
        'No se pudo identificar al usuario.',
      );
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta operación.',
      );
    }

    return true;
  }
}
