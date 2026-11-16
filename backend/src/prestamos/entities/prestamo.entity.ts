import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { SolicitudPrestamo } from './solicitud-prestamo.entity';

@Entity('prestamos')
export class Prestamo {
  @PrimaryGeneratedColumn('uuid', { name: 'id_prestamo' })
  id_prestamo: string;

  @Column({ type: 'timestamp', name: 'fecha_entrega' })
  fecha_entrega: Date;

  @Column({
    type: 'timestamp',
    name: 'fecha_devolucion_prevista',
  })
  fecha_devolucion_prevista: Date;

  @Column({
    type: 'timestamp',
    name: 'fecha_devolucion_real',
    nullable: true,
  })
  fecha_devolucion_real: Date | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVO',
  })
  estado: string;

  @ManyToOne(() => SolicitudPrestamo, { nullable: false })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudPrestamo;
}