import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * GET /api/room/[slug] — Validate whether a room exists and return its status
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const room = await db.room.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        hostId: true,
        isActive: true,
        createdAt: true,
        endedAt: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...room,
      isHost: room.hostId === userId,
    });
  } catch (error) {
    console.error('[ROOM_VALIDATE_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/room/[slug] — End a specific room by slug
 */
export async function PATCH(_request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const room = await db.room.findUnique({ where: { slug } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.hostId !== userId) {
      return NextResponse.json({ error: 'Only the host can end this meeting' }, { status: 403 });
    }

    const updatedRoom = await db.room.update({
      where: { id: room.id },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('[ROOM_END_SLUG_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
