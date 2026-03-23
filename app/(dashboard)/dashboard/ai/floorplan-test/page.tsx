'use client';

import Link from 'next/link';

export default function FloorplanTestPage() {
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Extraction test removed</h1>
      <p className="text-sm text-muted-foreground">
        The floorplan extraction workflow is no longer part of LBOstack.
      </p>
      <p className="text-sm">
        Use <Link href="/dashboard/ai/documents" className="text-primary underline hover:no-underline">Documents</Link> to upload LBO inputs and run modeling from there.
      </p>
    </div>
  );
}
