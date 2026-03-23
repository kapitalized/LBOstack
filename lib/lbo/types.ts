/**
 * LBO domain types shared by:
 * - Excel extraction (Python engine -> DealSchema)
 * - Deterministic cashflow/sweep engine (TypeScript -> Schedule + IRR/MOIC)
 *
 * Note: MVP uses simple monthly buckets and assumes interest-only until swept down.
 */

export type CurrencyCode = string;

export interface LboDealSchema {
  /**
   * Number of modeled periods (MVP assumes monthly).
   * Period indices are 0..(periodCount-1).
   */
  periodCount: number;
  monthsPerPeriod?: number; // default: 1

  /**
   * Operating cash flow per period, after capex and before debt service.
   * Used as the base cash available for interest/principal payments.
   */
  operatingCashFlows: number[];

  /**
   * Transaction assumptions.
   * "purchasePrice" is the enterprise value (EV) at close.
   * Equity invested at close is computed by the engine unless you supply it.
   */
  transaction: {
    purchasePrice: number;
    /**
     * Exit value.
     * MVP supports a simple multiple of purchase price.
     * If you have a fixed exit price instead, set type='fixed'.
     */
    exit: { type: 'multiple'; exitMultiple: number } | { type: 'fixed'; exitValue: number };

    /**
     * Fees paid at close (reduces equity invested).
     * Use 0 for MVP if not modeled.
     */
    transactionFees?: number;
  };

  /**
   * Debt tranches that can be swept in order (senior-first).
   */
  debt: {
    tranches: TrancheInput[];
  };

  /**
   * Sweep rules and residual cash / equity distribution behavior.
   */
  sweep: SweepSettings;

  /**
   * Equity cashflow behavior (needed for IRR/MOIC).
   */
  equity: {
    /**
     * Equity invested at close.
     * If omitted, the engine uses:
     *   equityInvested = purchasePrice - totalInitialDebt - (transactionFees ?? 0)
     *
     * Convention: equity cashflow at time 0 is negative (investment).
     */
    initialEquityInvested?: number;
  };

  /**
   * Optional reserve cash that must remain at the end of each period.
   * If not provided, defaults to 0.
   */
  liquidityReserve?: {
    /**
     * Minimum cash that must remain at end of period.
     * Sweep principal amount is limited by this reserve.
     */
    minCashBalance?: number;
  };
}

export interface TrancheInput {
  /**
   * Unique id, used for mapping and outputs.
   */
  id: string;
  name?: string;

  /**
   * Starting principal balance.
   */
  initialPrincipal: number;

  /**
   * Annual interest rate (e.g. 0.11 for 11%).
   */
  annualInterestRate: number;

  /**
   * Sweep priority: lower number is more senior.
   * Example: senior-first order by priority ascending.
   */
  priority: number;

  /**
   * MVP supports interest-only until swept down to zero.
   * Keep this field for future expansion (e.g. scheduled amortization).
   */
  amortization?: { type: 'interest_only' };
}

export interface SweepSettings {
  /**
   * If true, any residual cash after all debt is repaid is distributed to equity.
   * If false, it remains in cash (MVP currently keeps it in cash anyway, but this
   * flag drives whether it is booked as an equity distribution).
   */
  distributeResidualToEquity?: boolean;

  /**
   * Timing of sweep inside the period (MVP: end-of-period).
   * Included for clarity and future extension.
   */
  timing?: 'end_of_period';
}

export interface LboScheduleRow {
  periodIndex: number; // 0..periodCount-1
  months: number;

  operatingCashFlow: number;

  /**
   * Interest due each tranche based on beginning-of-period balance.
   */
  interestDueByTranche: Record<string, number>;

  /**
   * Interest actually paid (MVP: equal to due if cash is sufficient; otherwise 0).
   */
  interestPaidByTranche: Record<string, number>;

  /**
   * Principal amount paid each tranche in priority order.
   */
  principalPaidByTranche: Record<string, number>;

  /**
   * Ending balances after interest/principal payments.
   */
  debtBalanceByTranche: Record<string, number>;

  beginningCash: number;
  endingCash: number;

  /**
   * Equity distribution paid in this period (dividend / residual release).
   * At exit, this should capture the net proceeds distributed to equity.
   */
  equityDistribution: number;
}

export interface LboScheduleOutput {
  rows: LboScheduleRow[];

  totals: {
    initialDebt: number;
    endingDebt: number;
    totalEquityDistributions: number;
    equityInvested: number; // positive number (for reporting); IRR uses negative at t0
  };
}

export interface LboMetrics {
  /**
   * Internal rate of return on equity (annualized).
   * Uses equity cashflows: [-equityInvested, distributions...].
   */
  irrAnnualized?: number;

  /**
   * Multiple on invested capital: total distributions / equityInvested.
   */
  moic?: number;
}

export interface LboModelOutput {
  schedule: LboScheduleOutput;
  metrics: LboMetrics;
}

export function normalizeMinCashBalance(deal: LboDealSchema): number {
  return deal.liquidityReserve?.minCashBalance ?? 0;
}

