
import {
  Controller,
  Get,
  Req,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Inscripcion } from './entities/inscripciones.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import type { SessionRequest } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/academico')
export class AcademicoController {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  @Roles('ESTUDIANTE')
  @Get('mis-materias')
  async obtenerMisMaterias(@Req() req: SessionRequest) {
    const inscripciones = await this.inscripcionRepository.find({
      where: {
        usuario: {
          id_usuario: req.user!.sub,
        },
        estado: 'ACTIVA',
        materia: {
          estado: true,
        },
      },
      relations: {
        materia: true,
      },
      order: {
        materia: {
          nombre: 'ASC',
        },
      },
    });

    return {
      success: true,
      total: inscripciones.length,
      materias: inscripciones.map((inscripcion) => ({
        id_materia: inscripcion.materia.id_materia,
        nombre: inscripcion.materia.nombre,
        clave: inscripcion.materia.clave,
        periodo: inscripcion.periodo,
      })),
    };
  }
}
