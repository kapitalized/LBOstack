'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LboDealSchema } from '@/lib/lbo/types';
import { simulateLboModel } from '@/lib/lbo/lbo-core';
import type { LboStructureState } from '@/lib/lbo/lbo-structure-store';
import { defaultLboStructureState, loadLboStructureState } from '@/lib/lbo/lbo-structure-store';
import { ProjectNav } from '../../ProjectNav';
import { useProject } from '../../ProjectProvider';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function StructureModelPage() {
  const params = useParams();
  const project = useProject();
  const shortId = params.shortId as string;
  const slug = params.slug as string;
  const base = `/project/${shortId}/${slug}`;

  const [state, setState] = useState<LboStructureState>(() => defaultLboStructureState());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortId || !slug) return;
    const loaded = loadLboStructureState(shortId, slug);
    if (loaded) setState(loaded);
  }, [shortId, slug]);

  const deal = useMemo((): { deal: LboDealSchema; errors: string[] } => {
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
  }, [state]);

  const modelResult = useMemo(() => {
    if (deal.errors.length > 0) {
      return { result: null as ReturnType<typeof simulateLboModel> | null, error: null as string | null };
    }
    try {
      return { result: simulateLboModel(deal.deal), error: null as string | null };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to simulate model.';
      return { result: null as ReturnType<typeof simulateLboModel> | null, error: message };
    }
  }, [deal.deal, deal.errors]);

  useEffect(() => {
    setError(modelResult.error);
  }, [modelResult.error]);

  const scheduleRows = modelResult.result?.schedule.rows ?? [];

  return (
    <div className="space-y-6">
      <ProjectNav shortId={shortId} slug={slug} />
      <div>
        <h1 className="text-2xl font-bold">Model</h1>
        <p className="mt-2 text-muted-foreground">5-year cashflow schedule generated by the MVP engine.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Engine Output Schedule</h2>
        {!modelResult.result && deal.errors.length > 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">
            {deal.errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Year</th>
                    <th className="p-2 text-left font-medium">Operating CF</th>
                    <th className="p-2 text-left font-medium">Interest Paid</th>
                    <th className="p-2 text-left font-medium">Principal Paid</th>
                    <th className="p-2 text-left font-medium">Debt Remaining</th>
                    <th className="p-2 text-left font-medium">Equity Distribution</th>
                    <th className="p-2 text-left font-medium">Ending Cash</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((r) => {
                    const interestPaid = sumRecord(r.interestPaidByTranche);
                    const principalPaid = sumRecord(r.principalPaidByTranche);
                    const debtRemaining = sumRecord(r.debtBalanceByTranche);
                    return (
                      <tr key={r.periodIndex} className="border-b last:border-0">
                        <td className="p-2 font-medium">{r.periodIndex + 1}</td>
                        <td className="p-2 tabular-nums">{formatMoney(r.operatingCashFlow)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(interestPaid)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(principalPaid)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(debtRemaining)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(r.equityDistribution)}</td>
                        <td className="p-2 tabular-nums">{formatMoney(r.endingCash)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`${base}/structure/funding`} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted/50">
            Back to Funding Structure
          </Link>
          <Link href={`${base}/structure/outputs`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            View Outputs
          </Link>
        </div>
      </section>
    </div>
  );
}

