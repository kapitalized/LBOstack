import { NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth/session';

export async function POST(req: Request) {
  const session = await getSessionForApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  void req;
  return NextResponse.json(
    { error: 'Legacy construction AI pipeline removed. Use /api/lbo/run for LBO modeling.' },
    { status: 410 }
  );
}
