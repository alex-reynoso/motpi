import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearEstructuraInicial1794785419676 implements MigrationInterface {
    name = 'CrearEstructuraInicial1794785419676'
 
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "roles" ("id_rol" SERIAL NOT NULL, "nombre" character varying(50) NOT NULL, "descripcion" text, CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE ("nombre"), CONSTRAINT "PK_25f8d4161f00a1dd1cbe5068695" PRIMARY KEY ("id_rol"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id_usuario" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "apellido" character varying(100) NOT NULL, "correo" character varying(150) NOT NULL, "password_hash" text NOT NULL, "matricula" character varying(30), "estado" character varying(20) NOT NULL DEFAULT 'ACTIVO', "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(), "id_rol" integer NOT NULL, CONSTRAINT "UQ_63665765c1a778a770c9bd585d3" UNIQUE ("correo"), CONSTRAINT "UQ_315c5fe46111074751535e53145" UNIQUE ("matricula"), CONSTRAINT "PK_dfe59db369749f9042499fd8107" PRIMARY KEY ("id_usuario"))`);
        await queryRunner.query(`CREATE TABLE "laboratorios" ("id_laboratorio" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "ubicacion" character varying(150) NOT NULL, "descripcion" text, "estado" character varying(20) NOT NULL DEFAULT 'ACTIVO', "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(), "id_encargado" uuid, CONSTRAINT "PK_edbb550b11505ca6df713310664" PRIMARY KEY ("id_laboratorio"))`);
        await queryRunner.query(`CREATE TABLE "recursos" ("id_recurso" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "tipo" character varying(80) NOT NULL, "numero_serie" character varying(100), "estado" character varying(30) NOT NULL DEFAULT 'DISPONIBLE', "descripcion" text, "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(), "id_laboratorio" integer NOT NULL, CONSTRAINT "UQ_04c6da27455329e33cf3ea32af5" UNIQUE ("numero_serie"), CONSTRAINT "PK_46b5350f6b6e5ccc3687cc886b1" PRIMARY KEY ("id_recurso"))`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_98bf89ebf4b0be2d3825f54e56c" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "laboratorios" ADD CONSTRAINT "FK_16d2e5bcc7d6053218d7034c8b6" FOREIGN KEY ("id_encargado") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recursos" ADD CONSTRAINT "FK_359a9fc3aa635faed5fc6a4ae87" FOREIGN KEY ("id_laboratorio") REFERENCES "laboratorios"("id_laboratorio") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recursos" DROP CONSTRAINT "FK_359a9fc3aa635faed5fc6a4ae87"`);
        await queryRunner.query(`ALTER TABLE "laboratorios" DROP CONSTRAINT "FK_16d2e5bcc7d6053218d7034c8b6"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_98bf89ebf4b0be2d3825f54e56c"`);
        await queryRunner.query(`DROP TABLE "recursos"`);
        await queryRunner.query(`DROP TABLE "laboratorios"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
