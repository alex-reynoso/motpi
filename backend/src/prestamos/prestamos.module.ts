import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrestamosController } from './prestamos.controller';
import { SolicitudPrestamo } from './entities/solicitud-prestamo.entity';
import { DetalleSolicitud } from './entities/detalle-solicitud.entity';
import { DecisionMotpi } from './entities/decision-motpi.entity';
import { Prestamo } from './entities/prestamo.entity';
import { TokenAutorizacion } from './entities/token-autorizacion.entity';
import { MotpiEngineModule } from '../motpi-engine/motpi-engine.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AcademicoModule } from '../academico/academico.module';
import { InventarioModule } from '../inventario/inventario.module';
import { PrestamosService } from './prestamos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudPrestamo,
      DetalleSolicitud,
      DecisionMotpi,
      Prestamo,
      TokenAutorizacion,
    ]),
    MotpiEngineModule, 
    UsuariosModule,
    AcademicoModule,
    InventarioModule,
  ],
  controllers: [PrestamosController],
  providers: [PrestamosService],
  exports: [TypeOrmModule, PrestamosService],
})
export class PrestamosModule {}  