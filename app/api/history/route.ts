import { NextResponse } from 'next/server';
import { getHistoryOverview } from '@/lib/claude-history';

export async function GET() {
  const data = await getHistoryOverview();
  return NextResponse.json(data);
}
