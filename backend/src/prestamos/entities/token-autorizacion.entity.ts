import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { SolicitudPrestamo } from './solicitud-prestamo.entity';

@Entity('tokens_autorizacion')
export class TokenAutorizacion {
  @PrimaryColumn({ type: 'uuid' })
  jti: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ISSUED',
  })
  estado: string;

  @CreateDateColumn({ name: 'fecha_emision' })
  fecha_emision: Date;

  @Column({
    type: 'timestamp',
    name: 'fecha_consumo',
    nullable: true,
  })
  fecha_consumo: Date | null;

  @OneToOne(() => SolicitudPrestamo, { nullable: false })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudPrestamo;
}