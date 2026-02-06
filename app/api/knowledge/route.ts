import { NextResponse } from 'next/server';
import { getAllKnowledgeSummaries } from '@/lib/claude-history';

export async function GET() {
  try {
    const knowledge = await getAllKnowledgeSummaries();
    return NextResponse.json(knowledge);
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
  }
}
