import { NextResponse } from 'next/server';
import { getSessionForApi } from '@/lib/auth/session';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await getSessionForApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  void params;
  return NextResponse.json({ error: 'Legacy floorplan overlay endpoint removed.' }, { status: 410 });
}
