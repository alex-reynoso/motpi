
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { Usuario } from '../usuarios/entities/usuarios.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const correo = dto.correo.trim().toLowerCase();

    const usuario = await this.usuarioRepository.findOne({
      where: { correo },
    });

    // Mensaje genérico para no revelar si el correo existe.
    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales incorrectas.',
      );
    }

    if (usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException(
        'Credenciales incorrectas.',
      );
    }

    const passwordValida = await compare(
      dto.password,
      usuario.password_hash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException(
        'Credenciales incorrectas.',
      );
    }

    const payload = {
      sub: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol.nombre,
      tipo: 'SESION',
    };

    const accessToken = await this.jwtService.signAsync(
      payload,
    );

    return {
      success: true,
      mensaje: 'Inicio de sesión correcto.',
      access_token: accessToken,
      token_type: 'Bearer',
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        matricula: usuario.matricula,
        rol: usuario.rol.nombre,
        estado: usuario.estado,
      },
    };
  }
}
