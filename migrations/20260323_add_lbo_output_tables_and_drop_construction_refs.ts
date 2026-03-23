import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lbo_model_runs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "project_id" uuid NOT NULL,
      "file_id" uuid,
      "scenario_name" text NOT NULL DEFAULT 'Base Case',
      "model_version" integer NOT NULL DEFAULT 1,
      "assumptions" jsonb NOT NULL,
      "results_summary" jsonb NOT NULL,
      "schedule_rows" jsonb,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_model_runs" ADD CONSTRAINT "lbo_model_runs_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE CASCADE ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_model_runs" ADD CONSTRAINT "lbo_model_runs_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."project_files"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lbo_model_audits" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "model_run_id" uuid NOT NULL,
      "audit_type" text NOT NULL,
      "severity" text NOT NULL DEFAULT 'info',
      "findings" jsonb NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_model_audits" ADD CONSTRAINT "lbo_model_audits_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lbo_model_presentations" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "model_run_id" uuid NOT NULL,
      "title" text NOT NULL,
      "format" text NOT NULL DEFAULT 'pdf',
      "content" text,
      "blob_url" text,
      "blob_key" text,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_model_presentations" ADD CONSTRAINT "lbo_model_presentations_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lbo_model_artifacts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "model_run_id" uuid NOT NULL,
      "artifact_type" text NOT NULL,
      "title" text NOT NULL,
      "spec" jsonb NOT NULL,
      "blob_url" text,
      "blob_key" text,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_model_artifacts" ADD CONSTRAINT "lbo_model_artifacts_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lbo_scenarios" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "project_id" uuid NOT NULL,
      "name" text NOT NULL,
      "scenario_type" text NOT NULL DEFAULT 'custom',
      "assumption_overrides" jsonb NOT NULL,
      "created_by_user_id" uuid,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_scenarios" ADD CONSTRAINT "lbo_scenarios_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_scenarios" ADD CONSTRAINT "lbo_scenarios_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lbo_sensitivity_runs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "model_run_id" uuid NOT NULL,
      "variable_x" text NOT NULL,
      "variable_y" text,
      "grid_definition" jsonb NOT NULL,
      "results_grid" jsonb NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "lbo_sensitivity_runs" ADD CONSTRAINT "lbo_sensitivity_runs_model_run_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DROP TABLE IF EXISTS "ref_knowledge_nodes" CASCADE;
    DROP TABLE IF EXISTS "ref_regional_factors" CASCADE;
    DROP TABLE IF EXISTS "ref_material_components" CASCADE;
    DROP TABLE IF EXISTS "ref_unit_conversions" CASCADE;
    DROP TABLE IF EXISTS "ref_standards" CASCADE;
    DROP TABLE IF EXISTS "ref_flooring_types" CASCADE;
    DROP TABLE IF EXISTS "ref_roof_types" CASCADE;
    DROP TABLE IF EXISTS "ref_wall_types" CASCADE;
    DROP TABLE IF EXISTS "ref_building_compositions" CASCADE;
    DROP TABLE IF EXISTS "ref_materials" CASCADE;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "lbo_sensitivity_runs" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "lbo_scenarios" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "lbo_model_artifacts" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "lbo_model_presentations" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "lbo_model_audits" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "lbo_model_runs" CASCADE;`);
}
