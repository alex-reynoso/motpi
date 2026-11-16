import { MigrationInterface, QueryRunner } from 'typeorm';

export class AgregarCondicionAcademica1794873400000
  implements MigrationInterface {

  name = 'AgregarCondicionAcademica1794873400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD COLUMN "condicion_academica" varchar(20)
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios"
      ADD CONSTRAINT "CHK_condicion_academica"
      CHECK (
        "condicion_academica" IS NULL
        OR "condicion_academica" IN ('REGULAR', 'IRREGULAR')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP CONSTRAINT "CHK_condicion_academica"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios"
      DROP COLUMN "condicion_academica"
    `);
  }
}