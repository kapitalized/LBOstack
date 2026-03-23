CREATE SCHEMA "public";
CREATE SCHEMA "drizzle";
CREATE SCHEMA "neon_auth";
CREATE TYPE "enum_external_integrations_environment" AS ENUM('sandbox', 'production');
CREATE TYPE "enum_users_role" AS ENUM('admin', 'user');
CREATE TABLE "ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid,
	"analysis_type" text NOT NULL,
	"analysis_result" jsonb NOT NULL,
	"input_source_ids" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"run_started_at" timestamp,
	"run_duration_ms" integer,
	"input_size_bytes" integer,
	"input_page_count" integer,
	"token_usage" jsonb,
	"models_used" jsonb,
	"step_trace" jsonb,
	"raw_extraction" jsonb
);
CREATE TABLE "ai_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"file_id" uuid,
	"project_id" uuid,
	"raw_extraction" jsonb NOT NULL,
	"summary" text,
	"processed_at" timestamp DEFAULT now(),
	"building_level" integer
);
CREATE TABLE "ai_knowledge_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid,
	"file_id" uuid,
	"content" text NOT NULL,
	"vector_id" text,
	"created_at" timestamp DEFAULT now(),
	"embedding" vector(1536)
);
CREATE TABLE "ai_model_config" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"extraction_model" text NOT NULL,
	"analysis_model" text NOT NULL,
	"synthesis_model" text NOT NULL,
	"chat_model" text NOT NULL,
	"updated_at" timestamp
);
CREATE TABLE "api_sources" (
	"id" serial PRIMARY KEY,
	"name" varchar NOT NULL,
	"adapter" varchar DEFAULT 'generic' NOT NULL,
	"config" jsonb NOT NULL,
	"enabled" boolean DEFAULT true,
	"cron_job_id" varchar,
	"last_run_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"thread_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid,
	"user_id" uuid,
	"title" text NOT NULL,
	"context_summary" text,
	"last_activity" timestamp DEFAULT now()
);
CREATE TABLE "external_api_runs" (
	"id" serial PRIMARY KEY,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" varchar NOT NULL,
	"records_fetched" integer,
	"error_message" text,
	"raw_result" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"api_sources_id" integer,
	"source_id" integer
);
CREATE TABLE "external_integrations" (
	"id" serial PRIMARY KEY,
	"service_name" varchar NOT NULL,
	"environment" enum_external_integrations_environment DEFAULT 'sandbox',
	"api_key" varchar NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "logs_ai_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE "logs_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid,
	"report_id" uuid NOT NULL,
	"analysis_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"source" text,
	"file_ids" jsonb
);
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "org_organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'team' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan_status" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"full_address" text,
	"address_line1" text,
	"address_line2" text,
	"address_postcode" text,
	"address_state_province" text,
	"address_country" text,
	"plan_tier" text
);
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY,
	"title" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"meta_title" varchar,
	"meta_description" varchar,
	"canonical_url" varchar,
	"index_page" boolean DEFAULT true,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta_keywords" varchar
);
CREATE TABLE "payload_kv" (
	"id" serial PRIMARY KEY,
	"key" varchar NOT NULL,
	"data" jsonb NOT NULL
);
CREATE TABLE "payload_locked_documents" (
	"id" serial PRIMARY KEY,
	"global_slug" varchar,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "payload_locked_documents_rels" (
	"id" serial PRIMARY KEY,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"users_id" integer,
	"pages_id" integer,
	"external_integrations_id" integer,
	"api_sources_id" integer,
	"external_api_runs_id" integer
);
CREATE TABLE "payload_migrations" (
	"id" serial PRIMARY KEY,
	"name" varchar,
	"batch" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "payload_preferences" (
	"id" serial PRIMARY KEY,
	"key" varchar,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "payload_preferences_rels" (
	"id" serial PRIMARY KEY,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"users_id" integer
);
CREATE TABLE "project_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"blob_url" text NOT NULL,
	"blob_key" text NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now(),
	"building_level" integer
);
CREATE TABLE "project_main" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"project_name" text NOT NULL,
	"project_address" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"project_description" text,
	"short_id" text,
	"slug" text,
	"project_objectives" text,
	"country" text,
	"project_status" text,
	"org_id" uuid,
	"address_line1" text,
	"address_line2" text,
	"address_postcode" text,
	"address_state_province" text,
	"address_country" text,
	"site_type" text,
	"number_of_levels" integer DEFAULT 1
);
CREATE TABLE "ref_building_compositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"building_category" text NOT NULL,
	"building_subtype" text,
	"structure_type" text,
	"concrete_intensity_m3_per_m2" numeric,
	"steel_intensity_kg_per_m2" numeric,
	"rebar_intensity_kg_per_m3_concrete" numeric,
	"brick_intensity_m3_per_m2" numeric,
	"timber_intensity_m3_per_m2" numeric,
	"glass_intensity_kg_per_m2" numeric,
	"region" text,
	"climate_zone" text,
	"seismic_zone" text,
	"confidence_interval_low" numeric,
	"confidence_interval_high" numeric,
	"sample_size" integer,
	"source_id" text,
	"source_name" text,
	"publication_year" integer,
	"confidence_level" numeric,
	"properties" jsonb,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"superseded_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_flooring_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"flooring_category" text NOT NULL,
	"flooring_type" text NOT NULL,
	"construction_method" text,
	"typical_thickness_mm" numeric,
	"density_kg_m3" numeric,
	"weight_kg_per_m2" numeric,
	"requires_screed" boolean DEFAULT false,
	"screed_thickness_mm" numeric,
	"screed_density_kg_m3" numeric,
	"properties" jsonb,
	"source_id" text,
	"confidence_level" numeric,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_knowledge_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content" text NOT NULL,
	"source_standard_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"embedding" vector(1536)
);
CREATE TABLE "ref_material_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_material_id" uuid,
	"component_material_id" uuid,
	"proportion_by_mass" numeric,
	"proportion_by_volume" numeric,
	"mix_designation" text,
	"cement_kg_per_m3" numeric,
	"water_kg_per_m3" numeric,
	"fine_aggregate_kg_per_m3" numeric,
	"coarse_aggregate_kg_per_m3" numeric,
	"admixtures" jsonb,
	"water_cement_ratio" numeric,
	"expected_strength_mpa" numeric,
	"source_id" text,
	"confidence_level" numeric,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category" text NOT NULL,
	"subcategory" text,
	"name" text NOT NULL,
	"standard_grade" text,
	"density_kg_m3" numeric,
	"unit_cost_estimate" numeric,
	"properties" jsonb,
	"source_id" text,
	"source_name" text,
	"publication_year" integer,
	"confidence_level" numeric,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"superseded_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_regional_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"region" text NOT NULL,
	"country" text,
	"climate_zone" text,
	"concrete_factor" numeric,
	"steel_factor" numeric,
	"timber_factor" numeric,
	"labor_cost_index" numeric,
	"material_cost_index" numeric,
	"typical_foundation_type" text,
	"typical_floor_to_floor_height_m" numeric,
	"source_id" text,
	"confidence_level" numeric,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_roof_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"roof_form" text NOT NULL,
	"structure_material" text,
	"covering_material" text,
	"typical_span_m" numeric,
	"typical_pitch_degrees" numeric,
	"typical_weight_kg_per_m2" numeric,
	"structure_weight_kg_per_m2" numeric,
	"covering_weight_kg_per_m2" numeric,
	"timber_intensity_m3_per_m2" numeric,
	"steel_intensity_kg_per_m2" numeric,
	"concrete_intensity_m3_per_m2" numeric,
	"properties" jsonb,
	"source_id" text,
	"confidence_level" numeric,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_standards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"authority" text NOT NULL,
	"code_number" text,
	"code_name" text NOT NULL,
	"section" text NOT NULL,
	"clause" text,
	"requirement_type" text,
	"requirement_value_numeric" numeric,
	"requirement_unit" text,
	"requirement_text" text,
	"description" text,
	"jurisdiction" text,
	"application" text,
	"building_types" text,
	"evaluation_formula" text,
	"source_url" text,
	"pdf_reference" text,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"superseded_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_unit_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"from_unit" text NOT NULL,
	"to_unit" text NOT NULL,
	"conversion_factor" numeric NOT NULL,
	"category" text,
	"formula" text,
	"description" text,
	"source_id" text,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "ref_wall_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"wall_category" text NOT NULL,
	"wall_type" text NOT NULL,
	"load_bearing" boolean DEFAULT false,
	"exterior_finish" text,
	"interior_finish" text,
	"typical_thickness_mm" numeric,
	"density_kg_m3" numeric,
	"weight_kg_per_m2" numeric,
	"u_value_w_per_m2k" numeric,
	"bricks_per_m2" numeric,
	"mortar_kg_per_m2" numeric,
	"reinforcement_kg_per_m2" numeric,
	"properties" jsonb,
	"source_id" text,
	"confidence_level" numeric,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
CREATE TABLE "report_generated" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid,
	"report_title" text NOT NULL,
	"report_type" text NOT NULL,
	"content" text,
	"blob_url" text,
	"analysis_source_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"building_level" integer,
	"short_id" text
);
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY,
	"site_title" varchar DEFAULT 'ConstructAI' NOT NULL,
	"title_template" varchar DEFAULT '%s | ConstructAI',
	"default_description" varchar,
	"default_o_g_image" varchar,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone
);
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY,
	"email" text NOT NULL,
	"plan_type" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"total_storage_used" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"default_org_id" uuid
);
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" varchar NOT NULL,
	"reset_password_token" varchar,
	"reset_password_expiration" timestamp with time zone,
	"salt" varchar,
	"hash" varchar,
	"login_attempts" numeric DEFAULT '0',
	"lock_until" timestamp with time zone,
	"role" enum_users_role DEFAULT 'user' NOT NULL
);
CREATE TABLE "users_sessions" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY,
	"created_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
CREATE TABLE "drizzle"."__drizzle_migrations" (
	"id" serial PRIMARY KEY,
	"hash" text NOT NULL,
	"created_at" bigint
);
CREATE TABLE "neon_auth"."account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"inviterId" uuid NOT NULL
);
CREATE TABLE "neon_auth"."jwks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"expiresAt" timestamp with time zone
);
CREATE TABLE "neon_auth"."member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "organization_slug_key" UNIQUE,
	"logo" text,
	"createdAt" timestamp with time zone NOT NULL,
	"metadata" text
);
CREATE TABLE "neon_auth"."project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"endpoint_id" text NOT NULL CONSTRAINT "project_config_endpoint_id_key" UNIQUE,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"trusted_origins" jsonb NOT NULL,
	"social_providers" jsonb NOT NULL,
	"email_provider" jsonb,
	"email_and_password" jsonb,
	"allow_localhost" boolean NOT NULL,
	"plugin_configs" jsonb,
	"webhook_config" jsonb
);
CREATE TABLE "neon_auth"."session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL CONSTRAINT "session_token_key" UNIQUE,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" uuid NOT NULL,
	"impersonatedBy" text,
	"activeOrganizationId" text
);
CREATE TABLE "neon_auth"."user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "user_email_key" UNIQUE,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" timestamp with time zone
);
CREATE TABLE "neon_auth"."verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX "ai_analyses_pkey" ON "ai_analyses" ("id");
CREATE UNIQUE INDEX "ai_digests_pkey" ON "ai_digests" ("id");
CREATE UNIQUE INDEX "ai_knowledge_nodes_pkey" ON "ai_knowledge_nodes" ("id");
CREATE UNIQUE INDEX "ai_model_config_pkey" ON "ai_model_config" ("id");
CREATE INDEX "api_sources_created_at_idx" ON "api_sources" ("created_at");
CREATE UNIQUE INDEX "api_sources_pkey" ON "api_sources" ("id");
CREATE INDEX "api_sources_updated_at_idx" ON "api_sources" ("updated_at");
CREATE UNIQUE INDEX "chat_messages_pkey" ON "chat_messages" ("id");
CREATE UNIQUE INDEX "chat_threads_pkey" ON "chat_threads" ("id");
CREATE INDEX "external_api_runs_api_sources_id_idx" ON "external_api_runs" ("api_sources_id");
CREATE INDEX "external_api_runs_created_at_idx" ON "external_api_runs" ("created_at");
CREATE UNIQUE INDEX "external_api_runs_pkey" ON "external_api_runs" ("id");
CREATE INDEX "external_api_runs_source_id_idx" ON "external_api_runs" ("source_id");
CREATE INDEX "external_api_runs_updated_at_idx" ON "external_api_runs" ("updated_at");
CREATE INDEX "external_integrations_created_at_idx" ON "external_integrations" ("created_at");
CREATE UNIQUE INDEX "external_integrations_pkey" ON "external_integrations" ("id");
CREATE INDEX "external_integrations_updated_at_idx" ON "external_integrations" ("updated_at");
CREATE UNIQUE INDEX "logs_ai_runs_pkey" ON "logs_ai_runs" ("id");
CREATE UNIQUE INDEX "logs_reports_pkey" ON "logs_reports" ("id");
CREATE UNIQUE INDEX "org_members_org_id_user_id_unique" ON "org_members" ("org_id","user_id");
CREATE UNIQUE INDEX "org_members_pkey" ON "org_members" ("id");
CREATE UNIQUE INDEX "org_organisations_pkey" ON "org_organisations" ("id");
CREATE INDEX "pages_created_at_idx" ON "pages" ("created_at");
CREATE UNIQUE INDEX "pages_pkey" ON "pages" ("id");
CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" ("slug");
CREATE INDEX "pages_updated_at_idx" ON "pages" ("updated_at");
CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" ("key");
CREATE UNIQUE INDEX "payload_kv_pkey" ON "payload_kv" ("id");
CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" ("created_at");
CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" ("global_slug");
CREATE UNIQUE INDEX "payload_locked_documents_pkey" ON "payload_locked_documents" ("id");
CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" ("updated_at");
CREATE INDEX "payload_locked_documents_rels_api_sources_id_idx" ON "payload_locked_documents_rels" ("api_sources_id");
CREATE INDEX "payload_locked_documents_rels_external_api_runs_id_idx" ON "payload_locked_documents_rels" ("external_api_runs_id");
CREATE INDEX "payload_locked_documents_rels_external_integrations_id_idx" ON "payload_locked_documents_rels" ("external_integrations_id");
CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" ("order");
CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" ("pages_id");
CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" ("parent_id");
CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" ("path");
CREATE UNIQUE INDEX "payload_locked_documents_rels_pkey" ON "payload_locked_documents_rels" ("id");
CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" ("users_id");
CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" ("created_at");
CREATE UNIQUE INDEX "payload_migrations_pkey" ON "payload_migrations" ("id");
CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" ("updated_at");
CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" ("created_at");
CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" ("key");
CREATE UNIQUE INDEX "payload_preferences_pkey" ON "payload_preferences" ("id");
CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" ("updated_at");
CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" ("order");
CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" ("parent_id");
CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" ("path");
CREATE UNIQUE INDEX "payload_preferences_rels_pkey" ON "payload_preferences_rels" ("id");
CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" ("users_id");
CREATE UNIQUE INDEX "project_files_pkey" ON "project_files" ("id");
CREATE UNIQUE INDEX "project_main_pkey" ON "project_main" ("id");
CREATE UNIQUE INDEX "ref_building_compositions_pkey" ON "ref_building_compositions" ("id");
CREATE UNIQUE INDEX "ref_flooring_types_pkey" ON "ref_flooring_types" ("id");
CREATE UNIQUE INDEX "ref_knowledge_nodes_pkey" ON "ref_knowledge_nodes" ("id");
CREATE UNIQUE INDEX "ref_material_components_pkey" ON "ref_material_components" ("id");
CREATE UNIQUE INDEX "ref_materials_pkey" ON "ref_materials" ("id");
CREATE UNIQUE INDEX "ref_regional_factors_pkey" ON "ref_regional_factors" ("id");
CREATE UNIQUE INDEX "ref_roof_types_pkey" ON "ref_roof_types" ("id");
CREATE UNIQUE INDEX "ref_standards_pkey" ON "ref_standards" ("id");
CREATE UNIQUE INDEX "ref_unit_conversions_pkey" ON "ref_unit_conversions" ("id");
CREATE UNIQUE INDEX "ref_wall_types_pkey" ON "ref_wall_types" ("id");
CREATE UNIQUE INDEX "report_generated_pkey" ON "report_generated" ("id");
CREATE UNIQUE INDEX "site_settings_pkey" ON "site_settings" ("id");
CREATE UNIQUE INDEX "user_profiles_pkey" ON "user_profiles" ("id");
CREATE INDEX "users_created_at_idx" ON "users" ("created_at");
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE INDEX "users_updated_at_idx" ON "users" ("updated_at");
CREATE INDEX "users_sessions_order_idx" ON "users_sessions" ("_order");
CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" ("_parent_id");
CREATE UNIQUE INDEX "users_sessions_pkey" ON "users_sessions" ("id");
CREATE UNIQUE INDEX "__drizzle_migrations_pkey" ON "drizzle"."__drizzle_migrations" ("id");
CREATE UNIQUE INDEX "account_pkey" ON "neon_auth"."account" ("id");
CREATE INDEX "account_userId_idx" ON "neon_auth"."account" ("userId");
CREATE INDEX "invitation_email_idx" ON "neon_auth"."invitation" ("email");
CREATE INDEX "invitation_organizationId_idx" ON "neon_auth"."invitation" ("organizationId");
CREATE UNIQUE INDEX "invitation_pkey" ON "neon_auth"."invitation" ("id");
CREATE UNIQUE INDEX "jwks_pkey" ON "neon_auth"."jwks" ("id");
CREATE INDEX "member_organizationId_idx" ON "neon_auth"."member" ("organizationId");
CREATE UNIQUE INDEX "member_pkey" ON "neon_auth"."member" ("id");
CREATE INDEX "member_userId_idx" ON "neon_auth"."member" ("userId");
CREATE UNIQUE INDEX "organization_pkey" ON "neon_auth"."organization" ("id");
CREATE UNIQUE INDEX "organization_slug_key" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "organization_slug_uidx" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "project_config_endpoint_id_key" ON "neon_auth"."project_config" ("endpoint_id");
CREATE UNIQUE INDEX "project_config_pkey" ON "neon_auth"."project_config" ("id");
CREATE UNIQUE INDEX "session_pkey" ON "neon_auth"."session" ("id");
CREATE UNIQUE INDEX "session_token_key" ON "neon_auth"."session" ("token");
CREATE INDEX "session_userId_idx" ON "neon_auth"."session" ("userId");
CREATE UNIQUE INDEX "user_email_key" ON "neon_auth"."user" ("email");
CREATE UNIQUE INDEX "user_pkey" ON "neon_auth"."user" ("id");
CREATE INDEX "verification_identifier_idx" ON "neon_auth"."verification" ("identifier");
CREATE UNIQUE INDEX "verification_pkey" ON "neon_auth"."verification" ("id");
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "project_main"("id");
ALTER TABLE "ai_digests" ADD CONSTRAINT "ai_digests_file_id_project_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "project_files"("id");
ALTER TABLE "ai_digests" ADD CONSTRAINT "ai_digests_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "project_main"("id");
ALTER TABLE "ai_knowledge_nodes" ADD CONSTRAINT "ai_knowledge_nodes_file_id_project_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "project_files"("id");
ALTER TABLE "ai_knowledge_nodes" ADD CONSTRAINT "ai_knowledge_nodes_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "project_main"("id");
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE;
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "project_main"("id");
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id");
ALTER TABLE "external_api_runs" ADD CONSTRAINT "external_api_runs_api_sources_fk" FOREIGN KEY ("api_sources_id") REFERENCES "api_sources"("id") ON DELETE CASCADE;
ALTER TABLE "external_api_runs" ADD CONSTRAINT "external_api_runs_source_fk" FOREIGN KEY ("source_id") REFERENCES "api_sources"("id") ON DELETE CASCADE;
ALTER TABLE "logs_ai_runs" ADD CONSTRAINT "logs_ai_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_main"("id") ON DELETE SET NULL;
ALTER TABLE "logs_ai_runs" ADD CONSTRAINT "logs_ai_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "ai_analyses"("id") ON DELETE CASCADE;
ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project_main"("id") ON DELETE CASCADE;
ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "report_generated"("id") ON DELETE CASCADE;
ALTER TABLE "logs_reports" ADD CONSTRAINT "logs_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL;
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_org_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "org_organisations"("id") ON DELETE CASCADE;
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE;
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_api_sources_fk" FOREIGN KEY ("api_sources_id") REFERENCES "api_sources"("id") ON DELETE CASCADE;
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_external_api_runs_fk" FOREIGN KEY ("external_api_runs_id") REFERENCES "external_api_runs"("id") ON DELETE CASCADE;
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_external_integrations_fk" FOREIGN KEY ("external_integrations_id") REFERENCES "external_integrations"("id") ON DELETE CASCADE;
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "pages"("id") ON DELETE CASCADE;
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE;
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_preferences"("id") ON DELETE CASCADE;
ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "project_main"("id");
ALTER TABLE "project_main" ADD CONSTRAINT "project_main_org_id_org_organisations_id_fk" FOREIGN KEY ("org_id") REFERENCES "org_organisations"("id") ON DELETE CASCADE;
ALTER TABLE "project_main" ADD CONSTRAINT "project_main_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id");
ALTER TABLE "ref_knowledge_nodes" ADD CONSTRAINT "ref_knowledge_nodes_source_standard_id_ref_standards_id_fk" FOREIGN KEY ("source_standard_id") REFERENCES "ref_standards"("id");
ALTER TABLE "ref_material_components" ADD CONSTRAINT "ref_material_components_component_material_id_ref_materials_id_" FOREIGN KEY ("component_material_id") REFERENCES "ref_materials"("id");
ALTER TABLE "ref_material_components" ADD CONSTRAINT "ref_material_components_parent_material_id_ref_materials_id_fk" FOREIGN KEY ("parent_material_id") REFERENCES "ref_materials"("id");
ALTER TABLE "report_generated" ADD CONSTRAINT "report_generated_analysis_source_id_ai_analyses_id_fk" FOREIGN KEY ("analysis_source_id") REFERENCES "ai_analyses"("id");
ALTER TABLE "report_generated" ADD CONSTRAINT "report_generated_project_id_project_main_id_fk" FOREIGN KEY ("project_id") REFERENCES "project_main"("id");
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_default_org_id_org_organisations_id_fk" FOREIGN KEY ("default_org_id") REFERENCES "org_organisations"("id");
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "neon_auth"."user"("id");
ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;