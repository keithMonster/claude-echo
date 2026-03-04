import { NextResponse } from 'next/server';
import { getSessionsByDate } from '@/lib/claude-history';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  // 验证日期格式 (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return NextResponse.json(
      { error: 'Invalid date format. Expected: YYYY-MM-DD' },
      { status: 400 }
    );
  }

  const data = await getSessionsByDate(date);
  return NextResponse.json(data);
}
