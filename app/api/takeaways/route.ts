import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const logs = await db.meetingLog.findMany({
    where: { type: 'SUMMARY', room: { hostId: userId } },
    include: { room: { select: { slug: true, createdAt: true, endedAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(logs);
}
