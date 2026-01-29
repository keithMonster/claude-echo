import { NextResponse } from 'next/server';
import { getSessionDetail } from '@/lib/claude-history';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = await getSessionDetail(id);

  if (!detail) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(detail);
}
