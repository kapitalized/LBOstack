'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProjectNav } from '../../ProjectNav';
import { useProject } from '../../ProjectProvider';
import type { FundingInstrument, LboStructureState } from '@/lib/lbo/lbo-structure-store';
import {
  defaultLboStructureState,
  loadLboStructureState,
  saveLboStructureState,
} from '@/lib/lbo/lbo-structure-store';
import { LboWizardNav } from '@/components/lbo/LboWizardNav';

function formatMoney(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function StructureFundingPage() {
  const params = useParams();
  const project = useProject();
  const shortId = params.shortId as string;
  const slug = params.slug as string;
  const base = `/project/${shortId}/${slug}`;

  const [state, setState] = useState<LboStructureState>(() => defaultLboStructureState());

  useEffect(() => {
    if (!shortId || !slug) return;
    const loaded = loadLboStructureState(shortId, slug);
    if (loaded) setState(loaded);
  }, [shortId, slug]);

  useEffect(() => {
    if (!shortId || !slug) return;
    saveLboStructureState(shortId, slug, state);
  }, [shortId, slug, state]);

  const totalAllocated = useMemo(
    () => state.instruments.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [state.instruments]
  );
  const fundingDifference = state.totalFundingNeeds - totalAllocated;

  const updateInstrument = (id: string, patch: Partial<FundingInstrument>) => {
    setState((s) => ({
      ...s,
      instruments: s.instruments.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  if (!project) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <ProjectNav shortId={shortId} slug={slug} />
      <LboWizardNav basePath={base} />
      <div>
        <h1 className="text-2xl font-bold">Funding Structure</h1>
        <p className="mt-2 text-muted-foreground">
          Step 2 of the wizard: allocate the deal across debt and equity sources. The funding gap updates live.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Funding Target & Difference</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Funding Needs</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(state.totalFundingNeeds)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Allocated</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(totalAllocated)}</p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              fundingDifference === 0
                ? 'border-green-600/40 bg-green-500/10'
                : fundingDifference > 0
                  ? 'border-amber-600/40 bg-amber-500/10'
                  : 'border-blue-600/40 bg-blue-500/10'
            }`}
          >
            <p className="text-xs text-muted-foreground">Difference (Needs - Allocated)</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(fundingDifference)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fundingDifference === 0
                ? 'Balanced'
                : fundingDifference > 0
                  ? 'Unfunded gap'
                  : 'Overfunded surplus'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Capital Instruments</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Edit the amount and typical pricing inputs. The MVP engine currently uses debt as interest-only tranches (with priority sweep) and uses equity as initial invested capital.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium">Type</th>
                <th className="p-2 text-left font-medium">Amount</th>
                <th className="p-2 text-left font-medium">Rate / Coupon %</th>
                <th className="p-2 text-left font-medium">Term (yrs)</th>
                <th className="p-2 text-left font-medium">Amort. %</th>
                <th className="p-2 text-left font-medium">Fees %</th>
                <th className="p-2 text-left font-medium">Target Return %</th>
                <th className="p-2 text-left font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {state.instruments.map((row) => (
                <tr key={row.id} className="border-b align-top last:border-0">
                  <td className="p-2 font-medium">{row.type}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={row.amount}
                      onChange={(e) => updateInstrument(row.id, { amount: Number(e.target.value) || 0 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.annualRatePct}
                      onChange={(e) => updateInstrument(row.id, { annualRatePct: Number(e.target.value) || 0 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={row.termYears}
                      onChange={(e) => updateInstrument(row.id, { termYears: Number(e.target.value) || 0 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.amortizationPct}
                      onChange={(e) => updateInstrument(row.id, { amortizationPct: Number(e.target.value) || 0 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.feesPct}
                      onChange={(e) => updateInstrument(row.id, { feesPct: Number(e.target.value) || 0 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.targetReturnPct}
                      onChange={(e) => updateInstrument(row.id, { targetReturnPct: Number(e.target.value) || 0 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={1}
                      value={row.priority}
                      onChange={(e) => updateInstrument(row.id, { priority: Number(e.target.value) || 1 })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              const equityIdx = state.instruments.findIndex((x) => x.type === 'Equity');
              if (equityIdx < 0) return;
              const otherTotal = state.instruments.reduce((sum, row, i) => (i === equityIdx ? sum : sum + row.amount), 0);
              const equityNeeded = Math.max(0, state.totalFundingNeeds - otherTotal);
              updateInstrument(state.instruments[equityIdx].id, { amount: equityNeeded });
            }}
            className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted/50"
          >
            Auto-balance Equity
          </button>
          <Link href={`${base}/structure`} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted/50">
            Back to Inputs
          </Link>
          <Link href={`${base}/structure/model`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Continue to Model
          </Link>
        </div>
      </section>
    </div>
  );
}

