
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Usuario } from '../../usuarios/entities/usuarios.entity';
import { Materia } from './materias.entity';

@Entity('inscripciones')
@Index(
  'UQ_inscripcion_usuario_materia_periodo',
  ['usuario', 'materia', 'periodo'],
  { unique: true },
)
export class Inscripcion {
  @PrimaryGeneratedColumn('uuid', { name: 'id_inscripcion' })
  id_inscripcion: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Materia, { nullable: false })
  @JoinColumn({ name: 'id_materia' })
  materia: Materia;

  @Column({ type: 'varchar', length: 30 })
  periodo: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVA',
  })
  estado: string;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;
}
  