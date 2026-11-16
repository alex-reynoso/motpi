
import { MigrationInterface, QueryRunner } from "typeorm";

export class CrearModuloPrestamos1794787000000
  implements MigrationInterface {

  name = 'CrearModuloPrestamos1794787000000';

  public async up(queryRunner: QueryRunner): Promise<void> {

    // 1. Solicitudes generales
    await queryRunner.query(`
      CREATE TABLE "solicitudes_prestamo" (
        "id_solicitud" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fecha_solicitud" TIMESTAMP NOT NULL DEFAULT now(),
        "estado" character varying(20) NOT NULL DEFAULT 'PENDIENTE',
        "id_usuario" uuid NOT NULL,
        CONSTRAINT "PK_solicitudes_prestamo"
          PRIMARY KEY ("id_solicitud")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitudes_prestamo"
      ADD CONSTRAINT "FK_solicitud_usuario"
      FOREIGN KEY ("id_usuario")
      REFERENCES "usuarios"("id_usuario")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // 2. Equipos incluidos en cada solicitud
    await queryRunner.query(`
      CREATE TABLE "detalle_solicitud" (
        "id_detalle" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "id_solicitud" uuid NOT NULL,
        "id_recurso" uuid NOT NULL,
        CONSTRAINT "PK_detalle_solicitud"
          PRIMARY KEY ("id_detalle"),
        CONSTRAINT "UQ_solicitud_recurso"
          UNIQUE ("id_solicitud", "id_recurso")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "detalle_solicitud"
      ADD CONSTRAINT "FK_detalle_solicitud"
      FOREIGN KEY ("id_solicitud")
      REFERENCES "solicitudes_prestamo"("id_solicitud")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "detalle_solicitud"
      ADD CONSTRAINT "FK_detalle_recurso"
      FOREIGN KEY ("id_recurso")
      REFERENCES "recursos"("id_recurso")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // 3. Decisiones del motor MOTPI
    await queryRunner.query(`
      CREATE TABLE "decisiones_motpi" (
        "id_decision" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "decision" character varying(20) NOT NULL,
        "justificacion" text NOT NULL,
        "fecha_evaluacion" TIMESTAMP NOT NULL DEFAULT now(),
        "id_solicitud" uuid NOT NULL,
        CONSTRAINT "PK_decisiones_motpi"
          PRIMARY KEY ("id_decision")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "decisiones_motpi"
      ADD CONSTRAINT "FK_decision_solicitud"
      FOREIGN KEY ("id_solicitud")
      REFERENCES "solicitudes_prestamo"("id_solicitud")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // 4. Préstamos autorizados
    await queryRunner.query(`
      CREATE TABLE "prestamos" (
        "id_prestamo" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fecha_entrega" TIMESTAMP NOT NULL,
        "fecha_devolucion_prevista" TIMESTAMP NOT NULL,
        "fecha_devolucion_real" TIMESTAMP,
        "estado" character varying(20) NOT NULL DEFAULT 'ACTIVO',
        "id_solicitud" uuid NOT NULL,
        CONSTRAINT "PK_prestamos"
          PRIMARY KEY ("id_prestamo"),
        CONSTRAINT "UQ_prestamo_solicitud"
          UNIQUE ("id_solicitud"),
        CONSTRAINT "CHK_fechas_prestamo"
          CHECK ("fecha_devolucion_prevista" > "fecha_entrega"),
        CONSTRAINT "CHK_devolucion_real"
          CHECK (
            "fecha_devolucion_real" IS NULL
            OR "fecha_devolucion_real" >= "fecha_entrega"
          )
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "prestamos"
      ADD CONSTRAINT "FK_prestamo_solicitud"
      FOREIGN KEY ("id_solicitud")
      REFERENCES "solicitudes_prestamo"("id_solicitud")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // 5. Tokens de autorización y control JTI
    await queryRunner.query(`
      CREATE TABLE "tokens_autorizacion" (
        "jti" uuid NOT NULL,
        "estado" character varying(20) NOT NULL DEFAULT 'ISSUED',
        "fecha_emision" TIMESTAMP NOT NULL DEFAULT now(),
        "fecha_consumo" TIMESTAMP,
        "id_solicitud" uuid NOT NULL,
        CONSTRAINT "PK_tokens_autorizacion"
          PRIMARY KEY ("jti"),
        CONSTRAINT "UQ_token_solicitud"
          UNIQUE ("id_solicitud"),
        CONSTRAINT "CHK_estado_token"
          CHECK ("estado" IN ('ISSUED', 'CONSUMED'))
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tokens_autorizacion"
      ADD CONSTRAINT "FK_token_solicitud"
      FOREIGN KEY ("id_solicitud")
      REFERENCES "solicitudes_prestamo"("id_solicitud")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      ALTER TABLE "tokens_autorizacion"
      DROP CONSTRAINT "FK_token_solicitud"
    `);

    await queryRunner.query(`
      ALTER TABLE "prestamos"
      DROP CONSTRAINT "FK_prestamo_solicitud"
    `);

    await queryRunner.query(`
      ALTER TABLE "decisiones_motpi"
      DROP CONSTRAINT "FK_decision_solicitud"
    `);

    await queryRunner.query(`
      ALTER TABLE "detalle_solicitud"
      DROP CONSTRAINT "FK_detalle_recurso"
    `);

    await queryRunner.query(`
      ALTER TABLE "detalle_solicitud"
      DROP CONSTRAINT "FK_detalle_solicitud"
    `);

    await queryRunner.query(`DROP TABLE "tokens_autorizacion"`);
    await queryRunner.query(`DROP TABLE "prestamos"`);
    await queryRunner.query(`DROP TABLE "decisiones_motpi"`);
    await queryRunner.query(`DROP TABLE "detalle_solicitud"`);
    await queryRunner.query(`DROP TABLE "solicitudes_prestamo"`);
  }
}
