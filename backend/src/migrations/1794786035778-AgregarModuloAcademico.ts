import { MigrationInterface, QueryRunner } from "typeorm";

export class AgregarModuloAcademico1794786035778 implements MigrationInterface {
    name = 'AgregarModuloAcademico1794786035778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "materias" ("id_materia" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "clave" character varying(30) NOT NULL, "estado" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_6127b2d5fce128f2c62584c0247" UNIQUE ("clave"), CONSTRAINT "PK_4d205db0b2eebd17268116a0cc9" PRIMARY KEY ("id_materia"))`);
        await queryRunner.query(`CREATE TABLE "inscripciones" ("id_inscripcion" uuid NOT NULL DEFAULT uuid_generate_v4(), "periodo" character varying(30) NOT NULL, "estado" character varying(20) NOT NULL DEFAULT 'ACTIVA', "fecha_registro" TIMESTAMP NOT NULL DEFAULT now(), "id_usuario" uuid NOT NULL, "id_materia" integer NOT NULL, CONSTRAINT "PK_ab04dde6bcd98c1d0f65f665a7c" PRIMARY KEY ("id_inscripcion"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_inscripcion_usuario_materia_periodo" ON "inscripciones"  ("id_usuario", "id_materia", "periodo") `);
        await queryRunner.query(`ALTER TABLE "inscripciones" ADD CONSTRAINT "FK_303f97e84e11e88de9c473628aa" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscripciones" ADD CONSTRAINT "FK_b8d207057b33fa8263e3e84672a" FOREIGN KEY ("id_materia") REFERENCES "materias"("id_materia") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inscripciones" DROP CONSTRAINT "FK_b8d207057b33fa8263e3e84672a"`);
        await queryRunner.query(`ALTER TABLE "inscripciones" DROP CONSTRAINT "FK_303f97e84e11e88de9c473628aa"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_inscripcion_usuario_materia_periodo"`);
        await queryRunner.query(`DROP TABLE "inscripciones"`);
        await queryRunner.query(`DROP TABLE "materias"`);
    }

}
