
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorregirZonaHorariaSolicitud1794901000000
  implements MigrationInterface {

  name = 'CorregirZonaHorariaSolicitud1794901000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitudes_prestamo"
      ALTER COLUMN "fecha_solicitud"
      TYPE TIMESTAMPTZ
      USING "fecha_solicitud" AT TIME ZONE 'UTC'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitudes_prestamo"
      ALTER COLUMN "fecha_solicitud"
      TYPE TIMESTAMP
      USING "fecha_solicitud" AT TIME ZONE 'UTC'
    `);
  }
}
