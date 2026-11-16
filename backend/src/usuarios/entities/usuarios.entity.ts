
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Rol } from './roles.entity';
import { Laboratorio } from '../../laboratorios/entities/laboratorios.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario' })
  id_usuario: string;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo: string;

  @Column({ type: 'text', name: 'password_hash' })
  password_hash: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    unique: true,
  })
  matricula: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVO',
  })
  estado: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'condicion_academica',
  })
  condicion_academica: string | null;

  @CreateDateColumn({ name: 'fecha_registro' })
  fecha_registro: Date;

  @OneToMany(() => Laboratorio, (laboratorio) => laboratorio.encargado)
  laboratorios: Laboratorio[];
}
  