import { BRAND } from '@/lib/brand';

export const metadata = {
  title: 'Features',
  description: `Explore ${BRAND.name} features: LBO model ingestion, auditing, cashflow statements, and waterfall analytics.`,
};

const features = [
  {
    title: 'Excel model upload & parsing',
    description: 'Upload Excel LBO models and assumptions. We map template inputs into a structured deal schema for deterministic modeling.',
  },
  {
    title: 'Model auditing',
    description: 'Audit key assumptions, debt tranches, and dependencies before sharing outputs with IC or leadership.',
  },
  {
    title: 'Cashflow statements',
    description: 'Generate period-by-period operating cashflow, interest, principal paydown, debt balance, and equity distribution schedules.',
  },
  {
    title: 'Waterfall graphs & reporting',
    description: 'View and share waterfall-style debt paydown and distribution summaries, then export model outputs for teams and stakeholders.',
  },
  {
    title: 'Secure & organized',
    description: 'Project-based storage, org-scoped data, and encrypted uploads. Built for finance teams that need traceability and control.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Features</h1>
      <p className="mt-2 text-muted-foreground">
        Everything you need for LBO modeling, audit, and reporting workflows.
      </p>
      <ul className="mt-12 space-y-10">
        {features.map((f) => (
          <li key={f.title}>
            <h2 className="text-xl font-semibold" style={{ color: BRAND.colors.primary }}>
              {f.title}
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">{f.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
