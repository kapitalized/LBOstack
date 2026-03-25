export type InstrumentType = 'Senior Debt' | 'Subordinated Debt' | 'Equity' | 'Preference';

export type FundingInstrument = {
  id: string;
  type: InstrumentType;
  amount: number;
  annualRatePct: number;
  termYears: number;
  amortizationPct: number;
  feesPct: number;
  targetReturnPct: number;
  priority: number;
};

export type LboModelEngineInputs = {
  /** OCF in Year 1 (annualized). */
  initialOperatingCashFlow: number;
  /** Annual growth applied to OCF each year. */
  revenueGrowthPct: number;
  /** Exit value multiple applied to purchasePrice. */
  exitMultiple: number;
  /** Minimum cash to keep at end of each non-exit period. */
  minCashBalance: number;
  /** If true, distribute residual cash to equity. */
  distributeResidualToEquity: boolean;
  /** Model horizon in years (MVP uses 1 period per year). */
  periodYears: number;
};

export type LboStructureState = {
  version: 1;
  totalFundingNeeds: number;
  instruments: FundingInstrument[];
  model: LboModelEngineInputs;
};

const STORAGE_PREFIX = 'lbo_structure_state_v1';

export function getLboStructureStorageKey(shortId: string, slug: string): string {
  return `${STORAGE_PREFIX}:${shortId}:${slug}`;
}

export function defaultLboStructureState(): LboStructureState {
  return {
    version: 1,
    totalFundingNeeds: 100_000_000,
    instruments: [
      {
        id: 'senior-debt',
        type: 'Senior Debt',
        amount: 55_000_000,
        annualRatePct: 8,
        termYears: 7,
        amortizationPct: 5,
        feesPct: 1.25,
        targetReturnPct: 0,
        priority: 1,
      },
      {
        id: 'sub-debt',
        type: 'Subordinated Debt',
        amount: 15_000_000,
        annualRatePct: 12,
        termYears: 8,
        amortizationPct: 0,
        feesPct: 1.5,
        targetReturnPct: 0,
        priority: 2,
      },
      {
        id: 'equity',
        type: 'Equity',
        amount: 22_000_000,
        annualRatePct: 0,
        termYears: 5,
        amortizationPct: 0,
        feesPct: 0,
        targetReturnPct: 18,
        priority: 3,
      },
      {
        id: 'preference',
        type: 'Preference',
        amount: 8_000_000,
        annualRatePct: 9,
        termYears: 6,
        amortizationPct: 0,
        feesPct: 0.5,
        targetReturnPct: 12,
        priority: 4,
      },
    ],
    model: {
      initialOperatingCashFlow: 30_000_000,
      revenueGrowthPct: 3,
      exitMultiple: 4.0,
      minCashBalance: 5_000_000,
      distributeResidualToEquity: true,
      periodYears: 5,
    },
  };
}

export function loadLboStructureState(shortId: string, slug: string): LboStructureState | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getLboStructureStorageKey(shortId, slug);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LboStructureState>;
    if (!parsed || parsed.version !== 1) return null;
    // Basic shape guard; we still want defaults for any missing subfields.
    const defaults = defaultLboStructureState();
    return {
      ...defaults,
      ...parsed,
      model: { ...defaults.model, ...(parsed.model ?? {}) },
      instruments: Array.isArray(parsed.instruments) ? (parsed.instruments as FundingInstrument[]) : defaults.instruments,
    };
  } catch {
    return null;
  }
}

export function saveLboStructureState(shortId: string, slug: string, state: LboStructureState): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getLboStructureStorageKey(shortId, slug);
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage failures (private mode / quota exceeded).
  }
}

