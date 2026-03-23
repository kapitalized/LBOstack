import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export default function MarketingPage() {
  return (
    <div className="min-h-[80vh]">
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          LBO modeling and deal auditing, simplified
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload Excel models or assumptions, generate cashflow statements, run cash sweeps, and review waterfall graphs.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BRAND.colors.primary }}
          >
            Open the app
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center px-6 py-3 rounded-lg font-semibold border border-border hover:bg-muted transition-colors"
          >
            See features
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-10">Why {BRAND.name}</h2>
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div className="rounded-xl border-2 border-oilplot-ink bg-oilplot-ink px-5 py-6 shadow-retro-sm">
              <h3 className="font-semibold text-oilplot-cream">Upload & measure</h3>
              <p className="mt-2 text-sm text-oilplot-cream/90">
                Upload source Excel files and assumptions; we extract deal inputs into a structured model.
              </p>
            </div>
            <div className="rounded-xl border-2 border-oilplot-ink bg-oilplot-ink px-5 py-6 shadow-retro-sm">
              <h3 className="font-semibold text-oilplot-cream">Cashflows & sweeps</h3>
              <p className="mt-2 text-sm text-oilplot-cream/90">
                Run deterministic LBO cashflows, debt paydown, and senior-first cash sweep waterfalls.
              </p>
            </div>
            <div className="rounded-xl border-2 border-oilplot-ink bg-oilplot-ink px-5 py-6 shadow-retro-sm">
              <h3 className="font-semibold text-oilplot-cream">Audit & reporting</h3>
              <p className="mt-2 text-sm text-oilplot-cream/90">
                Generate review-ready statements, waterfall summaries, and audit outputs for IC discussions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + nav */}
      <section className="px-6 py-16 text-center">
        <p className="text-muted-foreground mb-6">
          Ready to model faster? Go to the app, or explore the rest of the site.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/dashboard" className="font-medium hover:underline" style={{ color: BRAND.colors.primary }}>
            App (Dashboard)
          </Link>
          <Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
        </div>
      </section>
    </div>
  );
}
