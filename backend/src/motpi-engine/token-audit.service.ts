
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

import { TokenAutorizacion } from '../prestamos/entities/token-autorizacion.entity';
import { SolicitudPrestamo } from '../prestamos/entities/solicitud-prestamo.entity';

interface JwtPayloadMotpi {
  sub: string;
  jti: string;
  solicitudId: string;
  iss: string;
  exp: number;
}

@Injectable()
export class TokenAuditService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async issueToken(
    solicitud: SolicitudPrestamo,
    manager: EntityManager,
  ): Promise<{ jti: string; token: string }> {
    const jti = randomUUID();

    const tokenRepository =
      manager.getRepository(TokenAutorizacion);

    const registro = tokenRepository.create({
      jti,
      estado: 'ISSUED',
      fecha_consumo: null,
      solicitud,
    });

    await tokenRepository.save(registro);

    const token = await this.jwtService.signAsync({
      sub: solicitud.usuario.id_usuario,
      jti,
      solicitudId: solicitud.id_solicitud,
    });

    return { jti, token };
  }

  async consumeToken(tokenJwt: string) {
    // 1. Verificar firma, emisor y expiración del JWT.
    let payload: JwtPayloadMotpi;

    try {
      payload =
        await this.jwtService.verifyAsync<JwtPayloadMotpi>(
          tokenJwt,
          {
            issuer: 'MOTPI',
            algorithms: ['HS256'],
          },
        );
    } catch {
      throw new BadRequestException(
        'JWT inválido, alterado o expirado.',
      );
    }

    // 2. Validar los datos necesarios del JWT.
    if (
      !payload.sub ||
      !payload.jti ||
      !payload.solicitudId
    ) {
      throw new BadRequestException(
        'El JWT no contiene los datos requeridos.',
      );
    }

    // 3. Comprobar que el JTI corresponde al usuario
    // y a la solicitud incluidos en el JWT.
    const tokenRepository =
      this.dataSource.getRepository(TokenAutorizacion);

    const registro = await tokenRepository.findOne({
      where: { jti: payload.jti },
      relations: {
        solicitud: {
          usuario: true,
        },
      },
    });

    if (
      !registro ||
      registro.solicitud.id_solicitud !== payload.solicitudId ||
      registro.solicitud.usuario.id_usuario !== payload.sub
    ) {
      throw new BadRequestException(
        'El JWT no corresponde a un registro de autorización válido.',
      );
    }

    // 4. Consumir el JTI mediante una actualización atómica.
    const resultado = await tokenRepository
      .createQueryBuilder()
      .update(TokenAutorizacion)
      .set({
        estado: 'CONSUMED',
        fecha_consumo: () => 'CURRENT_TIMESTAMP',
      })
      .where('jti = :jti', { jti: payload.jti })
      .andWhere('id_solicitud = :solicitudId', {
        solicitudId: payload.solicitudId,
      })
      .andWhere('estado = :estado', {
        estado: 'ISSUED',
      })
      .returning(['jti', 'estado', 'fecha_consumo'])
      .execute();

    if (resultado.affected !== 1) {
      throw new BadRequestException(
        'Token inválido o ya utilizado. Posible intento de Replay Attack.',
      );
    }

    const tokenConsumido = resultado.raw[0];

    return {
      success: true,
      jti: tokenConsumido.jti,
      status: tokenConsumido.estado,
      consumedAt: tokenConsumido.fecha_consumo,
    };
  }
}
 