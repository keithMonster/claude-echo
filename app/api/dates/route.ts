import { NextResponse } from 'next/server';
import { getAvailableDates } from '@/lib/claude-history';

export async function GET() {
  const dates = await getAvailableDates();
  return NextResponse.json(dates);
}
