import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ref_finance_risk_free_rates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "country_code" text NOT NULL,
      "currency_code" text NOT NULL,
      "tenor_years" numeric NOT NULL,
      "rate_percent" numeric NOT NULL,
      "source_name" text,
      "source_url" text,
      "observed_at" timestamp NOT NULL,
      "effective_from" timestamp DEFAULT now() NOT NULL,
      "effective_to" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ref_finance_equity_risk_premiums" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "country_code" text NOT NULL,
      "region" text,
      "erp_percent" numeric NOT NULL,
      "source_name" text,
      "source_url" text,
      "observed_at" timestamp NOT NULL,
      "effective_from" timestamp DEFAULT now() NOT NULL,
      "effective_to" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ref_finance_sector_betas" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sector" text NOT NULL,
      "subsector" text,
      "region" text,
      "beta_unlevered" numeric,
      "beta_levered" numeric,
      "net_debt_to_equity" numeric,
      "tax_rate_percent" numeric,
      "sample_size" integer,
      "source_name" text,
      "source_url" text,
      "observed_at" timestamp,
      "effective_from" timestamp DEFAULT now() NOT NULL,
      "effective_to" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ref_finance_credit_spreads" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "region" text,
      "currency_code" text NOT NULL,
      "rating_bucket" text NOT NULL,
      "seniority" text NOT NULL,
      "tenor_years" numeric,
      "spread_bps" integer NOT NULL,
      "source_name" text,
      "source_url" text,
      "observed_at" timestamp NOT NULL,
      "effective_from" timestamp DEFAULT now() NOT NULL,
      "effective_to" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ref_finance_tax_rates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "country_code" text NOT NULL,
      "tax_type" text NOT NULL DEFAULT 'corporate_income',
      "rate_percent" numeric NOT NULL,
      "source_name" text,
      "source_url" text,
      "effective_from" timestamp DEFAULT now() NOT NULL,
      "effective_to" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ref_finance_valuation_multiples" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "sector" text NOT NULL,
      "subsector" text,
      "region" text,
      "metric" text NOT NULL,
      "percentile_25" numeric,
      "median" numeric,
      "percentile_75" numeric,
      "sample_size" integer,
      "source_name" text,
      "source_url" text,
      "observed_at" timestamp NOT NULL,
      "effective_from" timestamp DEFAULT now() NOT NULL,
      "effective_to" timestamp,
      "created_at" timestamp DEFAULT now()
    );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "ref_finance_valuation_multiples" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "ref_finance_tax_rates" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "ref_finance_credit_spreads" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "ref_finance_sector_betas" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "ref_finance_equity_risk_premiums" CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS "ref_finance_risk_free_rates" CASCADE;`);
}
