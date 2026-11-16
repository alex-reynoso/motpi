
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Recurso } from './entities/recursos.entity';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recurso]),
  ],
  controllers: [
    InventarioController,
  ],
  providers: [
    InventarioService,
  ],
  exports: [
    InventarioService,
  ],
})
export class InventarioModule {}
 