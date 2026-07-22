import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { ensureDatabaseUser } from '@/lib/current-user';

/**
 * POST /api/room — Create a new meeting room
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDatabaseUser(userId);
    const body = await request.json().catch(() => ({})) as { personal?: boolean };
    if (body.personal) {
      const slug = `personal-${userId.slice(0, 12)}`;
      const existing = await db.room.findUnique({ where: { slug } });
      const room = existing
        ? await db.room.update({ where: { id: existing.id }, data: { isActive: true, endedAt: null } })
        : await db.room.create({ data: { slug, hostId: userId, isActive: true } });
      return NextResponse.json({ roomId: room.id, slug: room.slug });
    }

    // Generate a unique slug using UUID (collision-proof)
    const shortId = randomUUID().split('-')[0]; // 8 hex chars
    const workspaceSlug = `meet-${shortId}`;

    const newRoom = await db.room.create({
      data: {
        slug: workspaceSlug,
        hostId: userId,
        isActive: true,
      },
    });

    return NextResponse.json({
      roomId: newRoom.id,
      slug: newRoom.slug,
    });
  } catch (error: unknown) {
    console.error('[ROOM_CREATE_ERROR]:', error);

    // Handle Prisma unique constraint violations with retry
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      // Retry once with a new slug
      try {
        const { userId } = await auth();
        const retrySlug = `meet-${randomUUID().split('-')[0]}${Date.now().toString(36).slice(-3)}`;
        const retryRoom = await db.room.create({
          data: {
            slug: retrySlug,
            hostId: userId!,
            isActive: true,
          },
        });
        return NextResponse.json({ roomId: retryRoom.id, slug: retryRoom.slug });
      } catch {
        return NextResponse.json({ error: 'Failed to create room. Please try again.' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/room — Fetch the authenticated user's meeting room history
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await db.room.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('[ROOM_LIST_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/room — End a meeting room (by roomId in body)
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, slug } = body as { roomId?: string; slug?: string };

    if (!roomId && !slug) {
      return NextResponse.json({ error: 'roomId or slug is required' }, { status: 400 });
    }

    const whereClause = roomId ? { id: roomId } : { slug: slug! };

    const room = await db.room.findUnique({ where: whereClause });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only the host can end the room
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
    console.error('[ROOM_END_ERROR]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
