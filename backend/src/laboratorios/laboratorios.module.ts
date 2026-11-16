
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Laboratorio } from './entities/laboratorios.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Laboratorio]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class LaboratoriosModule {}
