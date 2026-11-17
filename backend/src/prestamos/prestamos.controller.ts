import {
  Body,
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  Get,
  Req,
} from '@nestjs/common';

import { PrestamosService } from './prestamos.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';

import { Roles } from '../auth/decorators/roles.decorator';
import type { SessionRequest } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/prestamos')
export class PrestamosController {
  constructor(
    private readonly prestamosService: PrestamosService,
  ) {}

  // Consultar todas las solicitudes: personal autorizado.
  @Roles(
    'ADMINISTRADOR_SISTEMA',
    'ADMINISTRATIVO',
    'ENCARGADO_LABORATORIO',
  )
  @Get('solicitudes')
  obtenerSolicitudes() {
    return this.prestamosService.obtenerSolicitudes();
  }

  // Consultar únicamente las solicitudes del estudiante autenticado.
  @Roles('ESTUDIANTE')
  @Get('mis-solicitudes')
  obtenerMisSolicitudes(
    @Req() req: SessionRequest,
  ) {
    return this.prestamosService.obtenerSolicitudes(
      req.user!.sub,
    );
  }

  // Crear solicitud: únicamente estudiantes.
  @Roles('ESTUDIANTE')
  @Post('solicitudes')
  crearSolicitud(
    @Body() dto: CrearSolicitudDto,
    @Req() req: SessionRequest,
  ) {
    return this.prestamosService.crearSolicitud(
      dto,
      req.user!.sub,
    );
  }

  // Devolver préstamo: encargado o administrador.
  @Roles(
    'ADMINISTRADOR_SISTEMA',
    'ENCARGADO_LABORATORIO',
  )
  @Post(':id/devolucion')
  devolverPrestamo(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.prestamosService.devolverPrestamo(id);
  } 
}