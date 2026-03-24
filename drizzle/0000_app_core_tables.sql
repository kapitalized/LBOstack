CREATE SCHEMA IF NOT EXISTS "neon_auth";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"analysis_type" text NOT NULL,
	"analysis_result" jsonb NOT NULL,
	"input_source_ids" jsonb NOT NULL,
	"raw_extraction" jsonb,
	"created_at" timestamp DEFAULT now(),
	"run_started_at" timestamp,
	"run_duration_ms" integer,
	"input_size_bytes" integer,
	"input_page_count" integer,
	"token_usage" jsonb,
	"models_used" jsonb,
	"step_trace" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid,
	"project_id" uuid,
	"building_level" integer,
	"raw_extraction" jsonb NOT NULL,
	"summary" text,
	"processed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_knowledge_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"file_id" uuid,
	"content" text NOT NULL,
	"vector_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_model_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"extraction_model" text NOT NULL,
	"analysis_model" text NOT NULL,
	"synthesis_model" text NOT NULL,
	"chat_model" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"title" text NOT NULL,
	"context_summary" text,
	"last_activity" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lbo_model_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_run_id" uuid NOT NULL,
	"artifact_type" text NOT NULL,
	"title" text NOT NULL,
	"spec" jsonb NOT NULL,
	"blob_url" text,
	"blob_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lbo_model_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_run_id" uuid NOT NULL,
	"audit_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"findings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lbo_model_presentations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_run_id" uuid NOT NULL,
	"title" text NOT NULL,
	"format" text DEFAULT 'pdf' NOT NULL,
	"content" text,
	"blob_url" text,
	"blob_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lbo_model_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"file_id" uuid,
	"scenario_name" text DEFAULT 'Base Case' NOT NULL,
	"model_version" integer DEFAULT 1 NOT NULL,
	"assumptions" jsonb NOT NULL,
	"results_summary" jsonb NOT NULL,
	"schedule_rows" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lbo_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"scenario_type" text DEFAULT 'custom' NOT NULL,
	"assumption_overrides" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lbo_sensitivity_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_run_id" uuid NOT NULL,
	"variable_x" text NOT NULL,
	"variable_y" text,
	"grid_definition" jsonb NOT NULL,
	"results_grid" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logs_ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"provider" text NOT NULL,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"cost" numeric,
	"latency_ms" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "logs_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid,
	"report_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"source" text,
	"file_ids" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"full_address" text,
	"address_line1" text,
	"address_line2" text,
	"address_postcode" text,
	"address_state_province" text,
	"address_country" text,
	"type" text DEFAULT 'team' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan_status" text,
	"plan_tier" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"building_level" integer,
	"blob_url" text NOT NULL,
	"blob_key" text NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_main" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"user_id" uuid,
	"project_name" text NOT NULL,
	"project_address" text,
	"address_line1" text,
	"address_line2" text,
	"address_postcode" text,
	"address_state_province" text,
	"address_country" text,
	"project_description" text,
	"project_objectives" text,
	"country" text,
	"site_type" text,
	"project_status" text,
	"short_id" text,
	"slug" text,
	"number_of_levels" integer DEFAULT 1,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ref_finance_credit_spreads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ref_finance_equity_risk_premiums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ref_finance_risk_free_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ref_finance_sector_betas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ref_finance_tax_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"tax_type" text DEFAULT 'corporate_income' NOT NULL,
	"rate_percent" numeric NOT NULL,
	"source_name" text,
	"source_url" text,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ref_finance_valuation_multiples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_generated" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_id" text,
	"project_id" uuid,
	"report_title" text NOT NULL,
	"report_type" text NOT NULL,
	"building_level" integer,
	"content" text,
	"blob_url" text,
	"analysis_source_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"plan_type" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"total_storage_used" integer DEFAULT 0,
	"default_org_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_auth"."user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"emailVerified" text,
	"image" text,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_digests" ADD CONSTRAINT "ai_digests_file_id_project_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."project_files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_digests" ADD CONSTRAINT "ai_digests_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_knowledge_nodes" ADD CONSTRAINT "ai_knowledge_nodes_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_knowledge_nodes" ADD CONSTRAINT "ai_knowledge_nodes_file_id_project_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."project_files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_model_artifacts" ADD CONSTRAINT "lbo_model_artifacts_model_run_id_lbo_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_model_audits" ADD CONSTRAINT "lbo_model_audits_model_run_id_lbo_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_model_presentations" ADD CONSTRAINT "lbo_model_presentations_model_run_id_lbo_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_model_runs" ADD CONSTRAINT "lbo_model_runs_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_model_runs" ADD CONSTRAINT "lbo_model_runs_file_id_project_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."project_files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_scenarios" ADD CONSTRAINT "lbo_scenarios_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_scenarios" ADD CONSTRAINT "lbo_scenarios_created_by_user_id_user_profiles_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lbo_sensitivity_runs" ADD CONSTRAINT "lbo_sensitivity_runs_model_run_id_lbo_model_runs_id_fk" FOREIGN KEY ("model_run_id") REFERENCES "public"."lbo_model_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_ai_runs" ADD CONSTRAINT "logs_ai_runs_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_ai_runs" ADD CONSTRAINT "logs_ai_runs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_report_id_report_generated_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report_generated"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_analysis_id_ai_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."ai_analyses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_org_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_main" ADD CONSTRAINT "project_main_org_id_org_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."org_organisations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_main" ADD CONSTRAINT "project_main_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_generated" ADD CONSTRAINT "report_generated_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_generated" ADD CONSTRAINT "report_generated_analysis_source_id_ai_analyses_id_fk" FOREIGN KEY ("analysis_source_id") REFERENCES "public"."ai_analyses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "neon_auth"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
