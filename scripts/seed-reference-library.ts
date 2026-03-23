/**
 * Seed the global finance reference library (ref_finance_* tables).
 * Run from project root: npx tsx scripts/seed-reference-library.ts
 * Requires DATABASE_URL (or DATABASE_URI) in env.
 */

import {
  db,
  ref_finance_risk_free_rates,
  ref_finance_equity_risk_premiums,
  ref_finance_sector_betas,
  ref_finance_credit_spreads,
  ref_finance_tax_rates,
  ref_finance_valuation_multiples,
} from '../lib/db';

async function seedReferenceLibrary() {
  console.log('🌱 Seeding finance reference library...');

  await db.insert(ref_finance_risk_free_rates).values([
    { country_code: 'US', currency_code: 'USD', tenor_years: '10', rate_percent: '4.10', source_name: 'US Treasury', observed_at: new Date() },
    { country_code: 'GB', currency_code: 'GBP', tenor_years: '10', rate_percent: '3.95', source_name: 'UK DMO', observed_at: new Date() },
    { country_code: 'PK', currency_code: 'PKR', tenor_years: '10', rate_percent: '12.50', source_name: 'SBP', observed_at: new Date() },
  ]);

  await db.insert(ref_finance_equity_risk_premiums).values([
    { country_code: 'US', region: 'North America', erp_percent: '5.00', source_name: 'Internal', observed_at: new Date() },
    { country_code: 'GB', region: 'Europe', erp_percent: '5.25', source_name: 'Internal', observed_at: new Date() },
    { country_code: 'PK', region: 'South Asia', erp_percent: '8.50', source_name: 'Internal', observed_at: new Date() },
  ]);

  await db.insert(ref_finance_sector_betas).values([
    { sector: 'General', subsector: 'Diversified', region: 'Global', beta_unlevered: '0.95', beta_levered: '1.15', sample_size: 250, source_name: 'Internal', observed_at: new Date() },
    { sector: 'Software', subsector: 'SaaS', region: 'Global', beta_unlevered: '1.10', beta_levered: '1.35', sample_size: 180, source_name: 'Internal', observed_at: new Date() },
    { sector: 'Healthcare', subsector: 'Providers', region: 'Global', beta_unlevered: '0.85', beta_levered: '1.05', sample_size: 120, source_name: 'Internal', observed_at: new Date() },
  ]);

  await db.insert(ref_finance_credit_spreads).values([
    { region: 'US', currency_code: 'USD', rating_bucket: 'BBB', seniority: 'senior_secured', tenor_years: '5', spread_bps: 180, source_name: 'Internal', observed_at: new Date() },
    { region: 'US', currency_code: 'USD', rating_bucket: 'BB', seniority: 'senior_secured', tenor_years: '5', spread_bps: 300, source_name: 'Internal', observed_at: new Date() },
    { region: 'US', currency_code: 'USD', rating_bucket: 'B', seniority: 'mezz', tenor_years: '5', spread_bps: 650, source_name: 'Internal', observed_at: new Date() },
  ]);

  await db.insert(ref_finance_tax_rates).values([
    { country_code: 'US', tax_type: 'corporate_income', rate_percent: '21.00', source_name: 'IRS' },
    { country_code: 'GB', tax_type: 'corporate_income', rate_percent: '25.00', source_name: 'HMRC' },
    { country_code: 'PK', tax_type: 'corporate_income', rate_percent: '29.00', source_name: 'FBR' },
  ]);

  await db.insert(ref_finance_valuation_multiples).values([
    { sector: 'Software', subsector: 'SaaS', region: 'US', metric: 'EV/EBITDA', percentile_25: '14.0', median: '18.5', percentile_75: '24.0', sample_size: 85, source_name: 'Internal', observed_at: new Date() },
    { sector: 'Healthcare', subsector: 'Providers', region: 'US', metric: 'EV/EBITDA', percentile_25: '9.5', median: '12.0', percentile_75: '15.5', sample_size: 60, source_name: 'Internal', observed_at: new Date() },
    { sector: 'Business Services', subsector: 'B2B', region: 'US', metric: 'EV/EBITDA', percentile_25: '8.0', median: '10.5', percentile_75: '13.5', sample_size: 70, source_name: 'Internal', observed_at: new Date() },
  ]);

  console.log('✅ Finance reference library seeded successfully');
}

seedReferenceLibrary().catch(console.error);
