
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Laboratorio } from '../../laboratorios/entities/laboratorios.entity';

@Entity('recursos')
export class Recurso {
  @PrimaryGeneratedColumn('uuid', { name: 'id_recurso' })
  id_recurso: string;

  @ManyToOne(() => Laboratorio, {
    nullable: false,
  })
  @JoinColumn({ name: 'id_laboratorio' })
  laboratorio: Laboratorio;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 80 })
  tipo: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: true,
    name: 'numero_serie',
  })
  numero_serie: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'DISPONIBLE',
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;
}
 