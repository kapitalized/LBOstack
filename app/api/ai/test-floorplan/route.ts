import { NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth/session';
export async function GET() {
  const session = await getSessionForApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Legacy floorplan test endpoint removed.' }, { status: 410 });
}

export async function POST(req: Request) {
  const session = await getSessionForApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  void req;
  return NextResponse.json({ error: 'Legacy floorplan test endpoint removed.' }, { status: 410 });
}
