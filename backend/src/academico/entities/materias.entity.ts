
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('materias')
export class Materia {
  @PrimaryGeneratedColumn({ name: 'id_materia' })
  id_materia: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  nombre: string;

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
  })
  clave: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  estado: boolean;
}
