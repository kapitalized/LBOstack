'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProjectNav } from '../../ProjectNav';
import { useProject } from '../../ProjectProvider';

export default function StructureRepaymentPage() {
  const params = useParams();
  const project = useProject();
  const shortId = params.shortId as string;
  const slug = params.slug as string;
  const base = `/project/${shortId}/${slug}`;

  if (!project) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <ProjectNav shortId={shortId} slug={slug} />
      <div>
        <h1 className="text-2xl font-bold">Outputs</h1>
        <p className="mt-2 text-muted-foreground">This view has moved. Use the `Outputs` step instead.</p>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <Link href={`${base}/structure/outputs`} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Go to Outputs
          </Link>
          <Link href={`${base}/structure/model`} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted/50">
            Back to Model
          </Link>
        </div>
      </section>
    </div>
  );
}

