import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

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

    if (!body?.title || !body?.startTime || !body?.duration) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const dbUser = await db.user.findUnique({ where: { id: userId } });
    if (!dbUser) return new NextResponse('User context sync initialization pending', { status: 400 });

    const parsedDate = new Date(body.startTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return new NextResponse('Invalid startTime format', { status: 400 });
    }

    const schedule = await db.schedule.create({
      data: {
        title: body.title,
        description: body.description || null,
        startTime: parsedDate,
        duration: body.duration,
        hostId: userId,
      },
    });

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

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('[SCHEDULE_GET_ERROR]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
