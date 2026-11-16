import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Usuario } from '../../usuarios/entities/usuarios.entity';

@Entity('solicitudes_prestamo')
export class SolicitudPrestamo {
  @PrimaryGeneratedColumn('uuid', { name: 'id_solicitud' })
  id_solicitud: string;

  @CreateDateColumn({ name: 'fecha_solicitud' })
  fecha_solicitud: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDIENTE',
  })
  estado: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}