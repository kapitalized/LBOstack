'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProjectNav } from '../../ProjectNav';
import { useProject } from '../../ProjectProvider';
import { simulateLboModel } from '@/lib/lbo/lbo-core';
import type { LboDealSchema, LboScheduleRow } from '@/lib/lbo/types';
import type { FundingInstrument, LboStructureState } from '@/lib/lbo/lbo-structure-store';
import { defaultLboStructureState, loadLboStructureState } from '@/lib/lbo/lbo-structure-store';

function sumRecord(values: Record<string, number> | undefined): number {
  if (!values) return 0;
  return Object.values(values).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
}

function formatMoney(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toFixed(2)}%`;
}

function buildDealFromState(state: LboStructureState): { deal: LboDealSchema; errors: string[] } {
  const errors: string[] = [];
  const periodYears = Math.max(1, Math.floor(state.model.periodYears ?? 5));

  const initialOCF = Number.isFinite(state.model.initialOperatingCashFlow) ? state.model.initialOperatingCashFlow : 0;
  const growthPct = Number.isFinite(state.model.revenueGrowthPct) ? state.model.revenueGrowthPct : 0;

  const operatingCashFlows: number[] = [];
  for (let i = 0; i < periodYears; i++) {
    const factor = Math.pow(1 + growthPct / 100, i);
    operatingCashFlows.push(initialOCF * factor);
  }

  const equityInstruments = state.instruments.filter((x) => x.type === 'Equity');
  const equityInvested = equityInstruments.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0);

  const debtInstruments = state.instruments.filter((x) => x.type !== 'Equity');
  if (debtInstruments.length === 0) errors.push('At least one debt-like instrument is required (Senior/Subordinated/Preference).');
  if (equityInvested <= 0) errors.push('Equity amount must be > 0 for IRR/MOIC calculations.');

  const tranches = debtInstruments
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map((t) => ({
      id: t.id,
      name: t.type,
      initialPrincipal: Number.isFinite(t.amount) ? t.amount : 0,
      annualInterestRate: Number.isFinite(t.annualRatePct) ? t.annualRatePct / 100 : 0,
      priority: t.priority,
      amortization: { type: 'interest_only' as const },
    }));

  const purchasePrice = Number.isFinite(state.totalFundingNeeds) ? state.totalFundingNeeds : 0;
  if (purchasePrice <= 0) errors.push('Total Funding Needs must be > 0.');

  const exitMultiple = Number.isFinite(state.model.exitMultiple) ? state.model.exitMultiple : 0;
  if (exitMultiple <= 0) errors.push('Exit multiple must be > 0.');

  const deal: LboDealSchema = {
    periodCount: periodYears,
    monthsPerPeriod: 12,
    operatingCashFlows,
    transaction: {
      purchasePrice,
      transactionFees: 0,
      exit: { type: 'multiple', exitMultiple },
    },
    debt: {
      tranches,
    },
    sweep: {
      distributeResidualToEquity: state.model.distributeResidualToEquity,
      timing: 'end_of_period',
    },
    equity: {
      initialEquityInvested: equityInvested,
    },
    liquidityReserve: {
      minCashBalance: Number.isFinite(state.model.minCashBalance) ? state.model.minCashBalance : 0,
    },
  };

  return { deal, errors };
}

export default function StructureOutputsPage() {
  const params = useParams();
  const shortId = params.shortId as string;
  const slug = params.slug as string;
  const base = `/project/${shortId}/${slug}`;

  const project = useProject();

  const [state, setState] = useState<LboStructureState>(() => defaultLboStructureState());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortId || !slug) return;
    const loaded = loadLboStructureState(shortId, slug);
    if (loaded) setState(loaded);
  }, [shortId, slug]);

  const { deal, errors } = useMemo(() => buildDealFromState(state), [state]);

  const modelResult = useMemo(() => {
    if (errors.length > 0) return { result: null as ReturnType<typeof simulateLboModel> | null, error: null as string | null };
    try {
      return { result: simulateLboModel(deal), error: null as string | null };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to simulate model.';
      return { result: null as ReturnType<typeof simulateLboModel> | null, error: message };
    }
  }, [deal, errors]);

  useEffect(() => {
    setError(modelResult.error);
  }, [modelResult.error]);

  const debtInstruments = useMemo(
    () => state.instruments.filter((x) => x.type !== 'Equity').slice().sort((a, b) => a.priority - b.priority),
    [state.instruments]
  );
  const scheduleRows: LboScheduleRow[] = modelResult.result?.schedule.rows ?? [];

  if (!project) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <ProjectNav shortId={shortId} slug={slug} />
      <div>
        <h1 className="text-2xl font-bold">Outputs</h1>
        <p className="mt-2 text-muted-foreground">Equity returns (IRR/MOIC) and the debt paydown schedule.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {modelResult.result && (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Key Returns</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">IRR (annualized)</p>
              <p className="mt-1 text-lg font-semibold">
                {modelResult.result.metrics.irrAnnualized != null ? formatPercent(modelResult.result.metrics.irrAnnualized * 100) : '—'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">MOIC</p>
              <p className="mt-1 text-lg font-semibold">
                {modelResult.result.metrics.moic != null ? modelResult.result.metrics.moic.toFixed(3) : '—'}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Equity Distributions</p>
              <p className="mt-1 text-lg font-semibold">{formatMoney(modelResult.result.schedule.totals.totalEquityDistributions)}</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Debt Paydown Schedule</h2>
        {!modelResult.result && errors.length > 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Year</th>
                    <th className="p-2 text-left font-medium">Operating CF</th>
                    <th className="p-2 text-left font-medium">Interest Paid</th>
                    <th className="p-2 text-left font-medium">Principal Paid</th>
                    <th className="p-2 text-left font-medium">Ending Cash</th>
                    {debtInstruments.map((t: FundingInstrument) => (
                      <th key={t.id} className="p-2 text-left font-medium">
                        End Debt ({t.type})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((r) => {
                    const interestPaid = sumRecord(r.interestPaidByTranche);
                    const principalPaid = sumRecord(r.principalPaidByTranche);
                    return (
                      <tr key={r.periodIndex} className="border-b last:border-0">
                        <td className="p-2 font-medium">{r.periodIndex + 1}</td>
                        <td className="p-2 tabular-nums">{formatMoney(r.operatingCashFlow)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(interestPaid)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(principalPaid)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(r.endingCash)}</td>
                        {debtInstruments.map((t) => (
                          <td key={t.id} className="p-2 tabular-nums">
                            {formatMoney(r.debtBalanceByTranche[t.id] ?? 0)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`${base}/structure/model`} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted/50">
                Back to Model
              </Link>
              <Link href={`${base}/structure/funding`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                Edit Funding
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

