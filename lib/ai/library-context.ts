/**
 * Load finance reference defaults and return a flat libraryContext for LBO/DCF flows.
 * Used when the request does not provide libraryContext so the pipeline uses DB-backed defaults.
 */

import { db } from '@/lib/db';
import {
  ref_finance_risk_free_rates,
  ref_finance_equity_risk_premiums,
  ref_finance_sector_betas,
} from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export type LibraryContext = Record<string, number | string>;

export async function loadLibraryContextForPipeline(projectId?: string | null): Promise<LibraryContext> {
  void projectId;
  const ctx: LibraryContext = {};

  const [riskFree] = await db
    .select({ rate_percent: ref_finance_risk_free_rates.rate_percent })
    .from(ref_finance_risk_free_rates)
    .where(
      and(
        eq(ref_finance_risk_free_rates.country_code, 'US'),
        eq(ref_finance_risk_free_rates.currency_code, 'USD')
      )
    )
    .orderBy(desc(ref_finance_risk_free_rates.observed_at))
    .limit(1);
  if (riskFree?.rate_percent != null) {
    ctx.risk_free_rate_percent = Number(riskFree.rate_percent);
  }

  const [erp] = await db
    .select({ erp_percent: ref_finance_equity_risk_premiums.erp_percent })
    .from(ref_finance_equity_risk_premiums)
    .where(eq(ref_finance_equity_risk_premiums.country_code, 'US'))
    .orderBy(desc(ref_finance_equity_risk_premiums.observed_at))
    .limit(1);
  if (erp?.erp_percent != null) {
    ctx.equity_risk_premium_percent = Number(erp.erp_percent);
  }

  const [beta] = await db
    .select({ beta_unlevered: ref_finance_sector_betas.beta_unlevered })
    .from(ref_finance_sector_betas)
    .where(eq(ref_finance_sector_betas.sector, 'General'))
    .orderBy(desc(ref_finance_sector_betas.observed_at))
    .limit(1);
  if (beta?.beta_unlevered != null) {
    ctx.beta_unlevered = Number(beta.beta_unlevered);
  }

  return ctx;
}
