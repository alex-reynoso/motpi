import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { SolicitudPrestamo } from './solicitud-prestamo.entity';
import { Recurso } from '../../inventario/entities/recursos.entity';

@Entity('detalle_solicitud')
export class DetalleSolicitud {
  @PrimaryGeneratedColumn('uuid', { name: 'id_detalle' })
  id_detalle: string;

  @ManyToOne(() => SolicitudPrestamo, { nullable: false })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudPrestamo;

  @ManyToOne(() => Recurso, { nullable: false })
  @JoinColumn({ name: 'id_recurso' })
  recurso: Recurso;
}