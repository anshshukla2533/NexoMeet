import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };
type NotePayload = { summary: string; keyPoints: string[]; actionItems: string[]; decisions: string[] };
type TranscriptEntry = { speaker: string; text: string };

const noteSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
    decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["summary", "keyPoints", "actionItems", "decisions"],
};

async function getRoom(slug: string) {
  return db.room.findUnique({ where: { slug }, select: { id: true } });
}

export async function GET(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const room = await getRoom((await params).slug);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(await db.meetingNote.findUnique({ where: { roomId: room.id } }));
}

export async function POST(_request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const room = await getRoom((await params).slug);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  const transcripts = await db.meetingTranscript.findMany({ where: { roomId: room.id }, orderBy: { timestamp: "asc" } });
  if (!transcripts.length) return NextResponse.json({ error: "No transcript fragments recorded yet." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Automatic notes are not configured." }, { status: 503 });

  const fullText = (transcripts as TranscriptEntry[]).map((entry) => `[${entry.speaker}]: ${entry.text}`).join("\n");
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `You are a precise meeting assistant. Create a factual meeting summary from this transcript. Do not invent details. Include only explicit decisions and actions; use empty arrays when none were made.\n\nTranscript:\n${fullText}`,
      config: { responseMimeType: "application/json", responseSchema: noteSchema },
    });
    const parsed = JSON.parse(response.text || "{}") as Partial<NotePayload>;
    const notes: NotePayload = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "No summary available yet.",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter((item): item is string => typeof item === "string") : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.filter((item): item is string => typeof item === "string") : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions.filter((item): item is string => typeof item === "string") : [],
    };
    const saved = await db.meetingNote.upsert({
      where: { roomId: room.id },
      create: { roomId: room.id, fullText, ...notes },
      update: { fullText, ...notes },
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Unable to generate meeting summary", error);
    return NextResponse.json({ error: "Failed to generate automatic notes." }, { status: 502 });
  }
}
