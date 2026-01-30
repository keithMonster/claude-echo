import { NextResponse } from 'next/server';
import { searchByToolOrSkill, getProjectsList } from '@/lib/claude-history';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const name = searchParams.get('name');

  if (type === 'project') {
    const projects = getProjectsList();
    return NextResponse.json(projects);
  }

  if ((type === 'tool' || type === 'skill') && name) {
    const results = await searchByToolOrSkill(type, name);
    return NextResponse.json(results);
  }

  return NextResponse.json({ error: 'Invalid search params' }, { status: 400 });
}
