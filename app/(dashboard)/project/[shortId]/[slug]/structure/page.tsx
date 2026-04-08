'use client';

import Link from 'next/link';
import { useProject } from '../ProjectProvider';
import { ProjectNav } from '../ProjectNav';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  defaultLboStructureState,
  loadLboStructureState,
  saveLboStructureState,
  type LboStructureState,
} from '@/lib/lbo/lbo-structure-store';
import { LboWizardNav } from '@/components/lbo/LboWizardNav';

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function ProjectStructurePage() {
  const params = useParams();
  const project = useProject();
  const shortId = params.shortId as string;
  const slug = params.slug as string;
  const base = `/project/${shortId}/${slug}`;
  const [state, setState] = useState<LboStructureState>(() => defaultLboStructureState());

  const totalAllocated = useMemo(
    () => state.instruments.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [state.instruments]
  );
  const fundingDifference = state.totalFundingNeeds - totalAllocated;

  useEffect(() => {
    if (!shortId || !slug) return;
    const loaded = loadLboStructureState(shortId, slug);
    if (!loaded) return;
    setState(loaded);
  }, [shortId, slug]);

  useEffect(() => {
    if (!shortId || !slug) return;
    saveLboStructureState(shortId, slug, state);
  }, [shortId, slug, state]);

  if (!project) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <ProjectNav shortId={shortId} slug={slug} />
      <LboWizardNav basePath={base} />
      <div>
        <h1 className="text-2xl font-bold">Inputs</h1>
        <p className="mt-2 text-muted-foreground">
          Start the LBO wizard by entering key deal information and the top-level model assumptions.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Key Deal Information</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Basic deal details used to frame the model before funding and outputs are reviewed.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Deal Name</p>
            <input
              type="text"
              value={state.deal.dealName}
              onChange={(e) => setState((s) => ({ ...s, deal: { ...s.deal, dealName: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Target Company</p>
            <input
              type="text"
              value={state.deal.targetCompany}
              onChange={(e) => setState((s) => ({ ...s, deal: { ...s.deal, targetCompany: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Sponsor</p>
            <input
              type="text"
              value={state.deal.sponsorName}
              onChange={(e) => setState((s) => ({ ...s, deal: { ...s.deal, sponsorName: e.target.value } }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Entry EBITDA</p>
            <input
              type="number"
              min={0}
              value={state.deal.entryEbitda}
              onChange={(e) => setState((s) => ({ ...s, deal: { ...s.deal, entryEbitda: Number(e.target.value) || 0 } }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Entry Multiple</p>
            <input
              type="number"
              min={0}
              step="0.1"
              value={state.deal.entryMultiple}
              onChange={(e) => setState((s) => ({ ...s, deal: { ...s.deal, entryMultiple: Number(e.target.value) || 0 } }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Purchase Price</p>
            <input
              type="number"
              min={0}
              value={state.deal.purchasePrice}
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                setState((s) => ({
                  ...s,
                  deal: { ...s.deal, purchasePrice: value },
                  totalFundingNeeds: value,
                }));
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Transaction Fees</p>
            <input
              type="number"
              min={0}
              value={state.deal.transactionFees}
              onChange={(e) => setState((s) => ({ ...s, deal: { ...s.deal, transactionFees: Number(e.target.value) || 0 } }))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Funding Target & Difference</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Funding Needs</p>
            <input
              type="number"
              min={0}
              value={state.totalFundingNeeds}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  totalFundingNeeds: Number(e.target.value) || 0,
                }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Allocated (all instruments)</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(totalAllocated)}</p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              fundingDifference === 0 ? 'border-green-600/40 bg-green-500/10' : fundingDifference > 0 ? 'border-amber-600/40 bg-amber-500/10' : 'border-blue-600/40 bg-blue-500/10'
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
        <h2 className="font-semibold">5-Year Engine Assumptions</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Set the cashflow engine levers (MVP): operating cash flow growth, exit multiple, cash reserve, and residual distribution.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Operating Cash Flow (Year 1)</p>
            <input
              type="number"
              min={0}
              value={state.model.initialOperatingCashFlow}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  model: { ...s.model, initialOperatingCashFlow: Number(e.target.value) || 0 },
                }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Annual Growth (%)</p>
            <input
              type="number"
              step="0.1"
              value={state.model.revenueGrowthPct}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  model: { ...s.model, revenueGrowthPct: Number(e.target.value) || 0 },
                }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Exit Multiple</p>
            <input
              type="number"
              step="0.1"
              min={0}
              value={state.model.exitMultiple}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  model: { ...s.model, exitMultiple: Number(e.target.value) || 0 },
                }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Cash Reserve Min ($)</p>
            <input
              type="number"
              min={0}
              value={state.model.minCashBalance}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  model: { ...s.model, minCashBalance: Number(e.target.value) || 0 },
                }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="rounded-lg border p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Distribute residual to equity</p>
              <p className="text-sm font-medium mt-1">{state.model.distributeResidualToEquity ? 'On' : 'Off'}</p>
            </div>
            <input
              type="checkbox"
              checked={state.model.distributeResidualToEquity}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  model: { ...s.model, distributeResidualToEquity: e.target.checked },
                }))
              }
              className="h-4 w-4"
            />
          </div>

          <label className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Model Horizon (years)</p>
            <input
              type="number"
              min={1}
              step="1"
              value={state.model.periodYears}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  model: { ...s.model, periodYears: Number(e.target.value) || 1 },
                }))
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`${base}/structure/funding`} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted/50">
            Continue to Funding Structure
          </Link>
          <Link href={`${base}/structure/model`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Continue to Model
          </Link>
        </div>
      </section>
    </div>
  );
}
