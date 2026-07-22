import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ensureDatabaseUser } from '@/lib/current-user';

type ScheduleCreateBody = {
  title: string;
  description?: string;
  startTime: string; 
  duration: number; 
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = (await request.json()) as ScheduleCreateBody;

    if (!body?.title?.trim() || !body?.startTime || !body?.duration || body.duration < 1 || body.duration > 480) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await ensureDatabaseUser(userId);

    const parsedDate = new Date(body.startTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return new NextResponse('Invalid startTime format', { status: 400 });
    }

    const roomSlug = `meet-${randomUUID().split('-')[0]}`;
    // PrismaNeon supports batched transactions, while the callback form can
    // require an interactive transaction that the serverless adapter rejects.
    const [, schedule] = await db.$transaction([
      db.room.create({ data: { slug: roomSlug, hostId: userId, isActive: false } }),
      db.schedule.create({
        data: {
          title: body.title.trim(), description: body.description?.trim() || null,
          startTime: parsedDate, duration: body.duration, hostId: userId, roomSlug,
        },
      }),
    ]);

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('[SCHEDULE_POST_ERROR]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const schedules = await db.schedule.findMany({
      where: { hostId: userId },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(schedules, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[SCHEDULE_GET_ERROR]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
