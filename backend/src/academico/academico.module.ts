
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Materia } from './entities/materias.entity';
import { Inscripcion } from './entities/inscripciones.entity';
import { AcademicoController } from './academico.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Materia, Inscripcion]),
  ],
  controllers: [AcademicoController],
  exports: [
    TypeOrmModule,
  ],
})
export class AcademicoModule {}
