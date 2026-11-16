
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { MotpiEngineModule } from './motpi-engine/motpi-engine.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { LaboratoriosModule } from './laboratorios/laboratorios.module';
import { InventarioModule } from './inventario/inventario.module';
import { AcademicoModule } from './academico/academico.module';
import { PrestamosModule } from './prestamos/prestamos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    AuthModule,
    MotpiEngineModule,
    UsuariosModule,
    LaboratoriosModule,
    InventarioModule,
    AcademicoModule,
    PrestamosModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
