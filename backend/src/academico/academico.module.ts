
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Materia } from './entities/materias.entity';
import { Inscripcion } from './entities/inscripciones.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Materia, Inscripcion]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class AcademicoModule {}
