/**
 * Schema: Neon Auth (neon_auth.*) + LBOstack app tables.
 * Run: npx drizzle-kit generate && npx drizzle-kit migrate
 */

import {
  pgTable,
  pgSchema,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  decimal,
  boolean,
} from 'drizzle-orm/pg-core';

// ---- Neon Auth (managed by Neon). Do not modify via migrations. ----
export const neonAuth = pgSchema('neon_auth');

export const users = neonAuth.table('user', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  emailVerified: text('emailVerified'),
  image: text('image'),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// ---- MODULE 1: USER & MEMBERSHIP ----
/** App extension of neon_auth.user: plan, Stripe, storage. id = neon_auth.user.id */
export const user_profiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().references(() => users.id),
  email: text('email').notNull(),
  planType: text('plan_type').default('free').notNull(), // 'free', 'basic', 'premium'
  stripeCustomerId: text('stripe_customer_id'),
  totalStorageUsed: integer('total_storage_used').default(0),
  /** Default org for project create and org switcher (e.g. user's personal org). */
  defaultOrgId: uuid('default_org_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---- ORG (organisations & team members; prefix Org_) ----
/** Organisations: personal (one per user) or team. Projects belong to an org. */
export const org_organisations = pgTable('org_organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(), // unique, e.g. 'acme' or 'user-abc123-personal'
  /** Full postal/legal address for the organisation. */
  fullAddress: text('full_address'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  addressPostcode: text('address_postcode'),
  addressStateProvince: text('address_state_province'),
  addressCountry: text('address_country'),
  type: text('type').notNull().default('team'), // 'personal' | 'team'
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  planStatus: text('plan_status'), // 'active', 'canceled', 'past_due', etc.
  planTier: text('plan_tier'), // 'starter' | 'pro' — set from Stripe metadata/price
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/** Org membership and role. Owner: billing, account. Admin: members + org settings. Analyst: projects, upload, analysis, reports. */
export const org_members = pgTable('org_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => org_organisations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => user_profiles.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'owner' | 'admin' | 'analyst'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- MODULE 2: PROJECTS / WORKSPACES & FILE MANAGEMENT ----
/** Projects (workspaces) belong to an organisation. Access: project owner OR org member (any role). */
export const project_main = pgTable('project_main', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => org_organisations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => user_profiles.id), // legacy/creator; access via org or this
  projectName: text('project_name').notNull(),
  projectAddress: text('project_address'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  addressPostcode: text('address_postcode'),
  addressStateProvince: text('address_state_province'),
  addressCountry: text('address_country'),
  projectDescription: text('project_description'), // short description
  projectObjectives: text('project_objectives'), // optional; kept for chat context
  country: text('country'),
  /** Legacy construction field; can be repurposed for sector/type during LBO migration. */
  siteType: text('site_type'),
  projectStatus: text('project_status'), // e.g. Active, Pause, Archive
  shortId: text('short_id'), // unique 6-char for URLs e.g. /project/abc123/my-building
  slug: text('slug'), // URL slug from name e.g. my-building
  /** Number of building levels (floors); used for floorplan upload slots and overview. */
  numberOfLevels: integer('number_of_levels').default(1),
  status: text('status').default('active'), // 'active', 'archived', 'completed'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const project_files = pgTable('project_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => project_main.id),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(), // e.g. 'Models', 'Model_Inputs'
  /** Building level (1-based) for floorplans; null for other docs. */
  buildingLevel: integer('building_level'),
  blobUrl: text('blob_url').notNull(),
  blobKey: text('blob_key').notNull(),
  fileSize: integer('file_size'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// ---- MODULE 3: AI DIGEST & ANALYSIS ----
export const ai_digests = pgTable('ai_digests', {
  id: uuid('id').defaultRandom().primaryKey(),
  fileId: uuid('file_id').references(() => project_files.id),
  projectId: uuid('project_id').references(() => project_main.id),
  /** Building level (1-based) copied from file for filtering reports. */
  buildingLevel: integer('building_level'),
  rawExtraction: jsonb('raw_extraction').notNull(),
  summary: text('summary'),
  processedAt: timestamp('processed_at').defaultNow(),
});

export const ai_analyses = pgTable('ai_analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => project_main.id),
  analysisType: text('analysis_type').notNull(), // 'quantities', 'comparison', 'structural'
  analysisResult: jsonb('analysis_result').notNull(),
  inputSourceIds: jsonb('input_source_ids').notNull(),
  /** Raw extraction from pipeline (items with bbox for overlay). Same run as this analysis. */
  rawExtraction: jsonb('raw_extraction'),
  createdAt: timestamp('created_at').defaultNow(),
  // Run metadata (when from pipeline)
  runStartedAt: timestamp('run_started_at'),
  runDurationMs: integer('run_duration_ms'),
  inputSizeBytes: integer('input_size_bytes'),
  inputPageCount: integer('input_page_count'),
  /** OpenRouter token usage and cost (prompt_tokens, completion_tokens, total_tokens, cost per step). */
  tokenUsage: jsonb('token_usage'),
  /** Model ids used for this run: { extraction, analysis, synthesis }. */
  modelsUsed: jsonb('models_used'),
  /** Per-step trace: prompt preview, response preview, tokens (for debugging and quality). */
  stepTrace: jsonb('step_trace'),
});

export const ai_knowledge_nodes = pgTable('ai_knowledge_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => project_main.id),
  fileId: uuid('file_id').references(() => project_files.id),
  content: text('content').notNull(),
  vectorId: text('vector_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- MODULE 4: INTERACTION & MEMORY ----
export const chat_threads = pgTable('chat_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => project_main.id),
  userId: uuid('user_id').references(() => user_profiles.id),
  title: text('title').notNull(),
  contextSummary: text('context_summary'),
  lastActivity: timestamp('last_activity').defaultNow(),
});

export const chat_messages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').references(() => chat_threads.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  citations: jsonb('citations'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- MODULE 5: OUTPUT & REPORTS ----
export const report_generated = pgTable('report_generated', {
  id: uuid('id').defaultRandom().primaryKey(),
  /** Short ID for URLs e.g. /project/abc123/slug/reports/xy12ab */
  shortId: text('short_id'),
  projectId: uuid('project_id').references(() => project_main.id),
  reportTitle: text('report_title').notNull(),
  reportType: text('report_type').notNull(), // e.g. 'Models'
  /** Building level (1-based) when report is for a specific level. */
  buildingLevel: integer('building_level'),
  content: text('content'),
  blobUrl: text('blob_url'),
  analysisSourceId: uuid('analysis_source_id').references(() => ai_analyses.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// ---- LOGS (audit: AI runs, report creation; use logs_ prefix) ----
/** One row per AI provider call (OpenRouter, etc.): model, tokens, cost, context. */
export const logs_ai_runs = pgTable('logs_ai_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  eventType: text('event_type').notNull(), // 'pipeline_run', 'chat_turn', 'batch_step'
  projectId: uuid('project_id').references(() => project_main.id),
  userId: uuid('user_id').references(() => user_profiles.id),
  provider: text('provider').notNull(), // 'openrouter'
  model: text('model'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),
  cost: decimal('cost'),
  latencyMs: integer('latency_ms'),
  metadata: jsonb('metadata'), // taskId, fileId, threadId, step, etc.
});

/** One row per report creation; links report → analysis → file(s) analysed for traceability. */
export const logs_reports = pgTable('logs_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  projectId: uuid('project_id').references(() => project_main.id).notNull(),
  userId: uuid('user_id').references(() => user_profiles.id),
  reportId: uuid('report_id').references(() => report_generated.id).notNull(),
  analysisId: uuid('analysis_id').references(() => ai_analyses.id).notNull(),
  reportType: text('report_type').notNull(), // e.g. 'Models'
  source: text('source'), // 'pipeline', 'from_chat', 'python_analyze'
  /** File(s) that were analysed to produce this report (project_files.id). Enables link back from report to source files. */
  fileIds: jsonb('file_ids'), // array of UUID strings
});

// ---- MODULE 6: FINANCE REFERENCE LIBRARY (LBO/DCF) ----
/** Sovereign risk-free rate curves by country and tenor, versioned by effective date. */
export const ref_finance_risk_free_rates = pgTable('ref_finance_risk_free_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  country_code: text('country_code').notNull(), // ISO-3166-1 alpha-2 (e.g. US, GB, PK)
  currency_code: text('currency_code').notNull(), // ISO-4217 (e.g. USD, GBP, PKR)
  tenor_years: decimal('tenor_years').notNull(), // 1, 2, 5, 10, 30...
  rate_percent: decimal('rate_percent').notNull(),
  source_name: text('source_name'),
  source_url: text('source_url'),
  observed_at: timestamp('observed_at').notNull(),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  effective_to: timestamp('effective_to'),
  created_at: timestamp('created_at').defaultNow(),
});

/** Equity risk premia by country/region for CAPM/WACC assumptions. */
export const ref_finance_equity_risk_premiums = pgTable('ref_finance_equity_risk_premiums', {
  id: uuid('id').defaultRandom().primaryKey(),
  country_code: text('country_code').notNull(),
  region: text('region'),
  erp_percent: decimal('erp_percent').notNull(),
  source_name: text('source_name'),
  source_url: text('source_url'),
  observed_at: timestamp('observed_at').notNull(),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  effective_to: timestamp('effective_to'),
  created_at: timestamp('created_at').defaultNow(),
});

/** Levered/unlevered beta references for sectors and sub-sectors. */
export const ref_finance_sector_betas = pgTable('ref_finance_sector_betas', {
  id: uuid('id').defaultRandom().primaryKey(),
  sector: text('sector').notNull(),
  subsector: text('subsector'),
  region: text('region'),
  beta_unlevered: decimal('beta_unlevered'),
  beta_levered: decimal('beta_levered'),
  net_debt_to_equity: decimal('net_debt_to_equity'),
  tax_rate_percent: decimal('tax_rate_percent'),
  sample_size: integer('sample_size'),
  source_name: text('source_name'),
  source_url: text('source_url'),
  observed_at: timestamp('observed_at'),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  effective_to: timestamp('effective_to'),
  created_at: timestamp('created_at').defaultNow(),
});

/** Credit spread references for debt pricing by rating and tenor. */
export const ref_finance_credit_spreads = pgTable('ref_finance_credit_spreads', {
  id: uuid('id').defaultRandom().primaryKey(),
  region: text('region'),
  currency_code: text('currency_code').notNull(),
  rating_bucket: text('rating_bucket').notNull(), // e.g. BBB, BB, B
  seniority: text('seniority').notNull(), // e.g. senior_secured, senior_unsecured, mezz
  tenor_years: decimal('tenor_years'),
  spread_bps: integer('spread_bps').notNull(),
  source_name: text('source_name'),
  source_url: text('source_url'),
  observed_at: timestamp('observed_at').notNull(),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  effective_to: timestamp('effective_to'),
  created_at: timestamp('created_at').defaultNow(),
});

/** Tax rate references used for NOPAT and post-tax cost of debt assumptions. */
export const ref_finance_tax_rates = pgTable('ref_finance_tax_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  country_code: text('country_code').notNull(),
  tax_type: text('tax_type').notNull().default('corporate_income'),
  rate_percent: decimal('rate_percent').notNull(),
  source_name: text('source_name'),
  source_url: text('source_url'),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  effective_to: timestamp('effective_to'),
  created_at: timestamp('created_at').defaultNow(),
});

/** Trading and transaction multiple comps by sector, region, and period. */
export const ref_finance_valuation_multiples = pgTable('ref_finance_valuation_multiples', {
  id: uuid('id').defaultRandom().primaryKey(),
  sector: text('sector').notNull(),
  subsector: text('subsector'),
  region: text('region'),
  metric: text('metric').notNull(), // e.g. EV/EBITDA, EV/Revenue, P/E
  percentile_25: decimal('percentile_25'),
  median: decimal('median'),
  percentile_75: decimal('percentile_75'),
  sample_size: integer('sample_size'),
  source_name: text('source_name'),
  source_url: text('source_url'),
  observed_at: timestamp('observed_at').notNull(),
  effective_from: timestamp('effective_from').defaultNow().notNull(),
  effective_to: timestamp('effective_to'),
  created_at: timestamp('created_at').defaultNow(),
});

// ---- MODULE 7: LBO OUTPUTS (reports, artifacts, scenarios) ----
/** One deterministic model run per model/version/scenario. */
export const lbo_model_runs = pgTable('lbo_model_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => project_main.id).notNull(),
  fileId: uuid('file_id').references(() => project_files.id),
  scenarioName: text('scenario_name').notNull().default('Base Case'),
  modelVersion: integer('model_version').notNull().default(1),
  assumptions: jsonb('assumptions').notNull(),
  resultsSummary: jsonb('results_summary').notNull(), // IRR, MOIC, leverage, DSCR...
  scheduleRows: jsonb('schedule_rows'), // normalized waterfall/cashflow rows
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Audit outputs that explain checks, exceptions, and model integrity findings. */
export const lbo_model_audits = pgTable('lbo_model_audits', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelRunId: uuid('model_run_id').references(() => lbo_model_runs.id, { onDelete: 'cascade' }).notNull(),
  auditType: text('audit_type').notNull(), // e.g. consistency, formulas, assumptions
  severity: text('severity').notNull().default('info'), // info | warning | error
  findings: jsonb('findings').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Presentation bundles for printable model packs and stakeholder outputs. */
export const lbo_model_presentations = pgTable('lbo_model_presentations', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelRunId: uuid('model_run_id').references(() => lbo_model_runs.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  format: text('format').notNull().default('pdf'), // pdf | pptx | html
  content: text('content'), // markdown/html body
  blobUrl: text('blob_url'),
  blobKey: text('blob_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Normalized chart/table artifacts produced from a model run. */
export const lbo_model_artifacts = pgTable('lbo_model_artifacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelRunId: uuid('model_run_id').references(() => lbo_model_runs.id, { onDelete: 'cascade' }).notNull(),
  artifactType: text('artifact_type').notNull(), // graph | waterfall | table
  title: text('title').notNull(),
  spec: jsonb('spec').notNull(), // chart/table spec or data payload
  blobUrl: text('blob_url'),
  blobKey: text('blob_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Scenario definitions for case-based planning (base, upside, downside, custom). */
export const lbo_scenarios = pgTable('lbo_scenarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => project_main.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  scenarioType: text('scenario_type').notNull().default('custom'), // base | upside | downside | custom
  assumptionOverrides: jsonb('assumption_overrides').notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => user_profiles.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/** Sensitivity grid outputs for variables such as entry multiple, growth, and exit multiple. */
export const lbo_sensitivity_runs = pgTable('lbo_sensitivity_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelRunId: uuid('model_run_id').references(() => lbo_model_runs.id, { onDelete: 'cascade' }).notNull(),
  variableX: text('variable_x').notNull(),
  variableY: text('variable_y'),
  gridDefinition: jsonb('grid_definition').notNull(),
  resultsGrid: jsonb('results_grid').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ---- APP SETTINGS (admin-configurable, single row) ----
/** OpenRouter model ids per AI step. Single row (id=1). */
export const ai_model_config = pgTable('ai_model_config', {
  id: integer('id').primaryKey().default(1),
  extraction_model: text('extraction_model').notNull(),
  analysis_model: text('analysis_model').notNull(),
  synthesis_model: text('synthesis_model').notNull(),
  chat_model: text('chat_model').notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
});
