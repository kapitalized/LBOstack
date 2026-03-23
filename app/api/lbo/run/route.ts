import { NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth/session';
import { callPythonEngine } from '@/lib/python-client';
import { simulateLboModel } from '@/lib/lbo/lbo-core';
import { db } from '@/lib/db';
import { project_files, project_main } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { canAccessProject } from '@/lib/org';
import { writeLogReport } from '@/lib/ai/logs';
import { persistLboModelResult } from '@/lib/ai/persistence';

function sumRecord(values: Record<string, number> | undefined): number {
  if (!values) return 0;
  return Object.values(values).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
}

function formatMoney(x: number): string {
  const n = Number.isFinite(x) ? x : 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatNumber(x: number, digits = 4): string {
  const n = Number.isFinite(x) ? x : 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export async function POST(req: Request) {
  const session = await getSessionForApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { projectId, fileId, fileUrl, templateId, overrides } = body as {
      projectId?: string;
      fileId?: string;
      fileUrl?: string;
      templateId?: string;
      overrides?: unknown;
    };

    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

    const ok = await canAccessProject(projectId, session.userId);
    if (!ok) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    let resolvedFileUrl: string | undefined = fileUrl;
    let resolvedFileName: string | undefined = undefined;
    let resolvedFileRowId: string | undefined = fileId;

    if (!resolvedFileUrl) {
      if (!resolvedFileRowId) return NextResponse.json({ error: 'Provide fileUrl or fileId.' }, { status: 400 });
      const [row] = await db
        .select({ blobUrl: project_files.blobUrl, fileName: project_files.fileName })
        .from(project_files)
        .where(eq(project_files.id, resolvedFileRowId))
        .limit(1);
      if (!row?.blobUrl) return NextResponse.json({ error: 'File not found.' }, { status: 404 });
      resolvedFileUrl = row.blobUrl;
      resolvedFileName = row.fileName ?? undefined;
    } else if (resolvedFileRowId && !resolvedFileName) {
      const [row] = await db
        .select({ fileName: project_files.fileName })
        .from(project_files)
        .where(eq(project_files.id, resolvedFileRowId))
        .limit(1);
      resolvedFileName = row?.fileName ?? undefined;
    }

    if (!resolvedFileUrl) return NextResponse.json({ error: 'Missing fileUrl.' }, { status: 400 });

    const pythonRes = await callPythonEngine<{ deal: unknown; warnings?: string[] }>('/lbo/extract-inputs', {
      data: [{ url: resolvedFileUrl }],
      parameters: {
        templateId: templateId ?? 'standard_mvp_lbo',
        overrides: overrides ?? null,
      },
    });

    if (pythonRes.status !== 'success') {
      return NextResponse.json({ error: pythonRes.detail ?? 'Python extraction failed.' }, { status: 500 });
    }

    const results = pythonRes.results;
    const first = Array.isArray(results) ? results[0] : (results as unknown as { deal: unknown; warnings?: string[] } | undefined);
    const deal = first?.deal;
    const warnings = first?.warnings ?? [];

    if (!deal || typeof deal !== 'object') return NextResponse.json({ error: 'No deal extracted.' }, { status: 422 });

    const model = simulateLboModel(deal as any);
    const rows = model.schedule.rows;
    const metrics = model.metrics;
    const totals = model.schedule.totals;

    const [projectRow] = await db
      .select({ projectName: project_main.projectName })
      .from(project_main)
      .where(eq(project_main.id, projectId))
      .limit(1);
    const projectName = projectRow?.projectName ?? 'Project';
    const dateStr = new Date().toISOString().slice(0, 10);
    const titleSuffix = resolvedFileName ? resolvedFileName.replace(/\.[^.]+$/, '') : 'Deal Inputs';
    const reportTitle = `${projectName} - LBO Model - ${titleSuffix} - ${dateStr}`;

    // Persist analysis + report (so Analyse view can render it).
    const items: unknown[] = [
      { type: 'metric', id: 'irr_annualized', label: 'IRR (annualized)', value: metrics.irrAnnualized ?? 0, unit: '%' },
      { type: 'metric', id: 'moic', label: 'MOIC', value: metrics.moic ?? 0, unit: 'x' },
      { type: 'metric', id: 'equity_invested', label: 'Equity invested', value: totals.equityInvested, unit: '' },
      { type: 'metric', id: 'initial_debt', label: 'Initial debt', value: totals.initialDebt, unit: '' },
      { type: 'metric', id: 'ending_debt', label: 'Ending debt', value: totals.endingDebt, unit: '' },
      { type: 'metric', id: 'total_distributions', label: 'Total equity distributions', value: totals.totalEquityDistributions, unit: '' },
      ...rows.map((r) => {
        const interestPaid = sumRecord(r.interestPaidByTranche);
        const principalPaid = sumRecord(r.principalPaidByTranche);
        const debtRemaining = sumRecord(r.debtBalanceByTranche);
        return {
          type: 'scheduleRow',
          periodIndex: r.periodIndex,
          label: `Period ${r.periodIndex + 1}`,
          months: r.months,
          operatingCashFlow: r.operatingCashFlow,
          interestPaidTotal: interestPaid,
          principalPaidTotal: principalPaid,
          debtRemainingTotal: debtRemaining,
          equityDistribution: r.equityDistribution,
          debtBalanceByTranche: r.debtBalanceByTranche,
        };
      }),
    ];

    const maxRowsInTable = 36;
    const tableRows = rows.length <= maxRowsInTable ? rows : [...rows.slice(0, 18), ...rows.slice(-18)];
    const hasEllipsis = rows.length > tableRows.length;

    const periodLines = tableRows
      .map((r) => {
        const interestPaid = sumRecord(r.interestPaidByTranche);
        const principalPaid = sumRecord(r.principalPaidByTranche);
        const debtRemaining = sumRecord(r.debtBalanceByTranche);
        const eqDist = r.equityDistribution;
        return `| ${r.periodIndex + 1} | ${formatMoney(r.operatingCashFlow)} | ${formatMoney(interestPaid)} | ${formatMoney(principalPaid)} | ${formatMoney(debtRemaining)} | ${formatMoney(eqDist)} |`;
      })
      .join('\n');

    const ellipsisLine = hasEllipsis ? `| ... | ... | ... | ... | ... | ... |` : '';

    const totalInterestPaid = rows.reduce((sum, r) => sum + sumRecord(r.interestPaidByTranche), 0);
    const totalPrincipalPaid = rows.reduce((sum, r) => sum + sumRecord(r.principalPaidByTranche), 0);

    let content = [
      `# ${reportTitle}`,
      '',
      '## Key Metrics',
      `- IRR (annualized): **${metrics.irrAnnualized != null ? formatNumber(metrics.irrAnnualized * 100, 2) + '%' : '0.00%'}**`,
      `- MOIC: **${metrics.moic != null ? formatNumber(metrics.moic, 3) : '0.000'}x**`,
      `- Equity invested: **${formatMoney(totals.equityInvested)}**`,
      `- Initial debt: **${formatMoney(totals.initialDebt)}**`,
      `- Total interest paid: **${formatMoney(totalInterestPaid)}**`,
      `- Total principal paid: **${formatMoney(totalPrincipalPaid)}**`,
      '',
      '## Debt Paydown & Cash Sweep (Summary)',
      '| Period | OCF | Interest Paid | Principal Paid | Debt Remaining | Equity Dist |',
      '|---:|---:|---:|---:|---:|---:|',
      periodLines,
      ellipsisLine ? ellipsisLine : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (warnings.length > 0) {
      content += `\n\n## CRITICAL WARNING\n${warnings.map((w: string) => `- ${w}`).join('\n')}`;
    }

    const runStartedAt = new Date();

    const { analysisId, reportId, reportShortId } = await persistLboModelResult({
      projectId,
      fileId: resolvedFileRowId ?? null,
      contentMarkdown: content,
      reportTitle,
      analysisItems: items,
      runStartedAt,
    });

    await writeLogReport({
      projectId,
      userId: session.userId,
      analysisId,
      reportId,
      reportType: 'lbo_model',
      source: 'python_analyze',
      fileIds: resolvedFileRowId ? [resolvedFileRowId] : [],
    });

    return NextResponse.json({
      success: true,
      reportId,
      reportShortId: reportShortId ?? null,
      persisted: { analysisId, reportId },
      model: {
        metrics,
        totalEquityDistributions: totals.totalEquityDistributions,
        periodCount: rows.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[LBO Run Error]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

