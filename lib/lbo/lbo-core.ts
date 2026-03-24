import type { LboDealSchema, LboModelOutput, TrancheInput, LboScheduleOutput, LboScheduleRow } from './types';
import type { LboMetrics } from './types';
import { normalizeMinCashBalance } from './types';

function computeExitValue(deal: LboDealSchema): number {
  const exit = deal.transaction.exit;
  if (exit.type === 'fixed') return exit.exitValue;
  return deal.transaction.purchasePrice * exit.exitMultiple;
}

function computeMonthlyInterestFactor(deal: LboDealSchema): number {
  const monthsPerPeriod = deal.monthsPerPeriod ?? 1;
  // Simple interest factor: annual rate * (months/12).
  return monthsPerPeriod / 12;
}

function validateDeal(deal: LboDealSchema): void {
  if (!Number.isFinite(deal.periodCount) || deal.periodCount <= 0) throw new Error('periodCount must be > 0');
  if (!Array.isArray(deal.operatingCashFlows)) throw new Error('operatingCashFlows must be an array');
  if (deal.operatingCashFlows.length !== deal.periodCount) {
    throw new Error(`operatingCashFlows length (${deal.operatingCashFlows.length}) must equal periodCount (${deal.periodCount})`);
  }
  if (!deal.debt?.tranches?.length) throw new Error('debt.tranches must be non-empty');
  for (const t of deal.debt.tranches) {
    if (!t.id) throw new Error('Each tranche must have an id');
    if (!Number.isFinite(t.initialPrincipal) || t.initialPrincipal < 0) throw new Error(`Tranche ${t.id} initialPrincipal must be >= 0`);
    if (!Number.isFinite(t.annualInterestRate) || t.annualInterestRate < 0) throw new Error(`Tranche ${t.id} annualInterestRate must be >= 0`);
    if (!Number.isFinite(t.priority)) throw new Error(`Tranche ${t.id} priority must be a number`);
  }
}

function totalInitialDebt(tranches: TrancheInput[]): number {
  return tranches.reduce((sum, t) => sum + (t.initialPrincipal || 0), 0);
}

function irrPeriodic(cashflows: number[]): number | undefined {
  // cashflows assumed evenly spaced with cashflows[0] at time 0,
  // and cashflows[i] received at end of period i.
  // Solve for r: sum cashflows[i]/(1+r)^i = 0.
  const hasPos = cashflows.some((x) => x > 0);
  const hasNeg = cashflows.some((x) => x < 0);
  if (!hasPos || !hasNeg) return undefined;

  const npv = (r: number) => {
    let s = 0;
    for (let i = 0; i < cashflows.length; i++) {
      s += cashflows[i] / Math.pow(1 + r, i);
    }
    return s;
  };

  let low = -0.999999;
  let high = 1.0;
  let fLow = npv(low);
  let fHigh = npv(high);

  // Expand high until we bracket a root.
  let expandCount = 0;
  while (fLow * fHigh > 0 && expandCount < 50) {
    high *= 2;
    fHigh = npv(high);
    expandCount++;
  }
  if (fLow * fHigh > 0) return undefined;

  // Bisection.
  for (let iter = 0; iter < 150; iter++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-10) return mid;
    if (fLow * fMid <= 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return (low + high) / 2;
}

function annualizeIrr(rPerPeriod: number, monthsPerPeriod: number): number {
  // Convert per-period periodic IRR to annualized IRR using compounding.
  // If monthsPerPeriod=1 => (1+r)^12 - 1
  const periodsPerYear = 12 / monthsPerPeriod;
  return Math.pow(1 + rPerPeriod, periodsPerYear) - 1;
}

export function simulateLboModel(deal: LboDealSchema): LboModelOutput {
  validateDeal(deal);
  const monthsPerPeriod = deal.monthsPerPeriod ?? 1;
  const sortedTranches = [...deal.debt.tranches].sort((a, b) => a.priority - b.priority);
  const balances: Record<string, number> = {};
  for (const t of sortedTranches) balances[t.id] = t.initialPrincipal;

  const initialDebt = totalInitialDebt(sortedTranches);

  const equityInvested =
    typeof deal.equity.initialEquityInvested === 'number'
      ? deal.equity.initialEquityInvested
      : deal.transaction.purchasePrice - initialDebt - (deal.transaction.transactionFees ?? 0);

  if (!Number.isFinite(equityInvested)) throw new Error('equityInvested could not be computed');
  if (equityInvested <= 0) throw new Error(`equityInvested must be > 0, got ${equityInvested}`);

  const exitValue = computeExitValue(deal);
  const minCashBalanceDefault = normalizeMinCashBalance(deal);
  const distributeResidualToEquity = deal.sweep.distributeResidualToEquity ?? true;

  const scheduleTotals: LboScheduleOutput = buildScheduleWithProperCashTracking(
    deal,
    sortedTranches,
    exitValue,
    equityInvested,
    minCashBalanceDefault,
    distributeResidualToEquity
  );

  const equityInvestedPositive = scheduleTotals.totals.equityInvested;
  const totalDistributions = scheduleTotals.totals.totalEquityDistributions;

  const metrics: LboMetrics = {};
  if (equityInvestedPositive > 0) {
    const cashflows = [-equityInvestedPositive, ...scheduleTotals.rows.map((r) => r.equityDistribution)];
    const rPerPeriod = irrPeriodic(cashflows);
    if (rPerPeriod != null) metrics.irrAnnualized = annualizeIrr(rPerPeriod, monthsPerPeriod);
    metrics.moic = totalDistributions / equityInvestedPositive;
  }

  return {
    schedule: scheduleTotals,
    metrics,
  };
}

function buildScheduleWithProperCashTracking(
  deal: LboDealSchema,
  sortedTranches: TrancheInput[],
  exitValue: number,
  equityInvested: number,
  minCashBalanceDefault: number,
  distributeResidualToEquity: boolean
): LboScheduleOutput {
  const monthsPerPeriod = deal.monthsPerPeriod ?? 1;
  const interestFactor = computeMonthlyInterestFactor(deal);

  const balances: Record<string, number> = {};
  for (const t of sortedTranches) balances[t.id] = t.initialPrincipal;

  let beginningCash = 0;
  const rows: LboScheduleRow[] = [];
  let totalEquityDistributions = 0;

  for (let periodIndex = 0; periodIndex < deal.periodCount; periodIndex++) {
    const isExitPeriod = periodIndex === deal.periodCount - 1;
    const opCf = deal.operatingCashFlows[periodIndex] ?? 0;

    const cashAvailable = beginningCash + opCf + (isExitPeriod ? exitValue : 0);

    const interestDueByTranche: Record<string, number> = {};
    const totalInterestDue = sortedTranches.reduce((sum, t) => {
      const bal = balances[t.id] ?? 0;
      const due = bal * t.annualInterestRate * interestFactor;
      interestDueByTranche[t.id] = due;
      return sum + due;
    }, 0);

    const interestPaidByTranche: Record<string, number> = {};
    let remainingCashAfterInterest = cashAvailable;
    if (totalInterestDue > 0) {
      if (cashAvailable >= totalInterestDue) {
        for (const t of sortedTranches) {
          const due = interestDueByTranche[t.id] ?? 0;
          interestPaidByTranche[t.id] = due;
        }
        remainingCashAfterInterest = cashAvailable - totalInterestDue;
      } else {
        const paidRatio = cashAvailable / totalInterestDue;
        for (const t of sortedTranches) {
          const due = interestDueByTranche[t.id] ?? 0;
          interestPaidByTranche[t.id] = due * paidRatio;
        }
        remainingCashAfterInterest = 0;
      }
    } else {
      for (const t of sortedTranches) interestPaidByTranche[t.id] = 0;
    }

    const principalPaidByTranche: Record<string, number> = {};
    let totalPrincipalPaid = 0;

    const periodMinCash = isExitPeriod ? 0 : minCashBalanceDefault;
    let sweepCashCap = Math.max(0, remainingCashAfterInterest - periodMinCash);

    for (const t of sortedTranches) {
      const bal = balances[t.id] ?? 0;
      if (bal <= 0 || sweepCashCap <= 0) {
        principalPaidByTranche[t.id] = 0;
        continue;
      }
      const paid = Math.min(bal, sweepCashCap);
      balances[t.id] = bal - paid;
      principalPaidByTranche[t.id] = paid;
      totalPrincipalPaid += paid;
      sweepCashCap -= paid;
    }

    const remainingAfterSweep = remainingCashAfterInterest - totalPrincipalPaid;
    const endingDebt = sortedTranches.reduce((sum, t) => sum + (balances[t.id] ?? 0), 0);

    let equityDistribution = 0;
    if (distributeResidualToEquity) {
      if (isExitPeriod || endingDebt <= 1e-9) {
        // Distribute all remaining cash at exit, or all cash above reserve after debt is fully repaid.
        equityDistribution = isExitPeriod ? remainingAfterSweep : Math.max(0, remainingAfterSweep - periodMinCash);
      }
    }

    const endingCash =
      isExitPeriod
        ? 0
        : distributeResidualToEquity
          ? Math.min(periodMinCash, remainingAfterSweep)
          : remainingAfterSweep;

    totalEquityDistributions += equityDistribution;

    const debtBalanceByTranche: Record<string, number> = {};
    for (const t of sortedTranches) debtBalanceByTranche[t.id] = balances[t.id] ?? 0;

    rows.push({
      periodIndex,
      months: monthsPerPeriod,
      operatingCashFlow: opCf,
      interestDueByTranche,
      interestPaidByTranche,
      principalPaidByTranche,
      debtBalanceByTranche,
      beginningCash,
      endingCash,
      equityDistribution,
    });

    beginningCash = endingCash;
  }

  const initialDebt = sortedTranches.reduce((sum, t) => sum + (t.initialPrincipal ?? 0), 0);
  const endingDebt = sortedTranches.reduce((sum, t) => sum + (balances[t.id] ?? 0), 0);

  return {
    rows,
    totals: {
      initialDebt,
      endingDebt,
      totalEquityDistributions,
      equityInvested: equityInvested,
    },
  };
}

