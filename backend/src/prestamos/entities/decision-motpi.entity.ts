import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { SolicitudPrestamo } from './solicitud-prestamo.entity';

@Entity('decisiones_motpi')
export class DecisionMotpi {
  @PrimaryGeneratedColumn('uuid', { name: 'id_decision' })
  id_decision: string;

  @Column({ type: 'varchar', length: 20 })
  decision: string;

  @Column({ type: 'text' })
  justificacion: string;

  @CreateDateColumn({ name: 'fecha_evaluacion' })
  fecha_evaluacion: Date;

  @ManyToOne(() => SolicitudPrestamo, { nullable: false })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudPrestamo;
}