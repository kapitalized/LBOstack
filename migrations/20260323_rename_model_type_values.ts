import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // File type renames
  await db.execute(sql`
    UPDATE "project_files"
    SET "file_type" = 'Models'
    WHERE "file_type" = 'lbo_model';
  `);
  await db.execute(sql`
    UPDATE "project_files"
    SET "file_type" = 'Model_Inputs'
    WHERE "file_type" IN ('lbo_input_data', 'lbo_inputs', 'supporting_data');
  `);

  // Report/log type renames
  await db.execute(sql`
    UPDATE "report_generated"
    SET "report_type" = 'Models'
    WHERE "report_type" IN ('lbo_model', 'quantity_takeoff');
  `);
  await db.execute(sql`
    UPDATE "logs_reports"
    SET "report_type" = 'Models'
    WHERE "report_type" IN ('lbo_model', 'quantity_takeoff');
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "project_files"
    SET "file_type" = 'lbo_model'
    WHERE "file_type" = 'Models';
  `);
  await db.execute(sql`
    UPDATE "project_files"
    SET "file_type" = 'lbo_input_data'
    WHERE "file_type" = 'Model_Inputs';
  `);

  await db.execute(sql`
    UPDATE "report_generated"
    SET "report_type" = 'lbo_model'
    WHERE "report_type" = 'Models';
  `);
  await db.execute(sql`
    UPDATE "logs_reports"
    SET "report_type" = 'lbo_model'
    WHERE "report_type" = 'Models';
  `);
}
