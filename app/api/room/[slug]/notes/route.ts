import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const room = await db.room.findUnique({ where: { slug }, select: { id: true } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  const notes = await db.meetingLog.findMany({ where: { roomId: room.id, type: 'SUMMARY' }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(notes);
}

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { content } = await request.json().catch(() => ({})) as { content?: string };
  const text = content?.trim();
  if (!text || text.length > 4000) return NextResponse.json({ error: 'Enter a note of up to 4,000 characters.' }, { status: 400 });
  const { slug } = await params;
  const room = await db.room.findUnique({ where: { slug }, select: { id: true } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  const note = await db.meetingLog.create({ data: { roomId: room.id, content: text, type: 'SUMMARY' } });
  return NextResponse.json(note, { status: 201 });
}
