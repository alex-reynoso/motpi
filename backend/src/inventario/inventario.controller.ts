
import {
  Controller,
  Get,
} from '@nestjs/common';

import { InventarioService } from './inventario.service';

@Controller('api/v1/inventario')
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
  ) {}

  @Get('recursos')
  obtenerRecursos() {
    return this.inventarioService.obtenerRecursos();
  }
}
