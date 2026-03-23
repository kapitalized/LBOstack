import { NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth/session';

export async function GET() {
  const session = await getSessionForApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Legacy floorplan extraction status endpoint removed.' }, { status: 410 });
}
