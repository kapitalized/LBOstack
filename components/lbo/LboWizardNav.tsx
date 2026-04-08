'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Step = {
  label: string;
  href: string;
  description: string;
};

export function LboWizardNav({ basePath }: { basePath: string }) {
  const pathname = usePathname();

  const steps: Step[] = [
    { label: '1. Inputs', href: `${basePath}/structure`, description: 'Key deal information and assumptions' },
    { label: '2. Funding', href: `${basePath}/structure/funding`, description: 'Debt and equity sources' },
    { label: '3. Model', href: `${basePath}/structure/model`, description: '5-year engine schedule' },
    { label: '4. Outputs', href: `${basePath}/structure/outputs`, description: 'IRR, MOIC, and paydown' },
  ];

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step) => {
          const active = pathname === step.href || pathname.startsWith(`${step.href}/`);
          return (
            <Link
              key={step.href}
              href={step.href}
              className={`min-w-[180px] flex-1 rounded-lg border px-3 py-3 transition-colors ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-semibold">{step.label}</p>
              <p className={`mt-1 text-xs ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {step.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

