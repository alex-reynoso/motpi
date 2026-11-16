
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuarios.entity';

@Entity('laboratorios')
export class Laboratorio {
  @PrimaryGeneratedColumn({ name: 'id_laboratorio' })
  id_laboratorio: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 150 })
  ubicacion: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVO',
  })
  estado: string;

  @ManyToOne(() => Usuario, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_encargado' })
  encargado: Usuario | null;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;
}
