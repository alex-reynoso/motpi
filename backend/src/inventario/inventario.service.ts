
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Recurso } from './entities/recursos.entity';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Recurso)
    private readonly recursoRepository: Repository<Recurso>,
  ) {}

  async obtenerRecursos() {
    const recursos = await this.recursoRepository
      .createQueryBuilder('recurso')
      .leftJoinAndSelect('recurso.laboratorio', 'laboratorio')
      .select([
        'recurso.id_recurso',
        'recurso.nombre',
        'recurso.tipo',
        'recurso.numero_serie',
        'recurso.estado',
        'recurso.descripcion',
        'recurso.fecha_registro',
        'laboratorio.id_laboratorio',
        'laboratorio.nombre',
        'laboratorio.ubicacion',
      ])
      .orderBy('recurso.nombre', 'ASC')
      .getMany();

    return {
      success: true,
      total: recursos.length,
      recursos,
    };
  }

  async obtenerRecursosPorIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    return this.recursoRepository.find({
      where: {
        id_recurso: In(ids),
      },
    });
  }
}
