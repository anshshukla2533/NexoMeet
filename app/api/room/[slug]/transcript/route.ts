import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

async function roomForSlug(slug: string) {
  return db.room.findUnique({ where: { slug }, select: { id: true } });
}

export async function GET(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const room = await roomForSlug(slug);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const transcripts = await db.meetingTranscript.findMany({
    where: { roomId: room.id }, orderBy: { timestamp: "asc" }, take: 250,
  });
  return NextResponse.json(transcripts);
}

export async function POST(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { speaker?: string; text?: string };
  const speaker = body.speaker?.trim().slice(0, 100) || "Participant";
  const text = body.text?.trim();
  if (!text || text.length > 4_000) {
    return NextResponse.json({ error: "Transcript text must be between 1 and 4,000 characters." }, { status: 400 });
  }
  const { slug } = await params;
  const room = await roomForSlug(slug);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const transcript = await db.meetingTranscript.create({ data: { roomId: room.id, speaker, text } });
  return NextResponse.json(transcript, { status: 201 });
}
