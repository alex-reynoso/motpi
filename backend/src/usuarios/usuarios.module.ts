
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './entities/roles.entity';
import { Usuario } from './entities/usuarios.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, Usuario]),
  ],
  exports: [
    TypeOrmModule,
  ],
})
export class UsuariosModule {}
