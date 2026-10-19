CREATE TABLE "MeetingTranscript" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetingTranscript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT[] NOT NULL,
    "actionItems" TEXT[] NOT NULL,
    "decisions" TEXT[] NOT NULL,
    "fullText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeetingNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeetingNote_roomId_key" ON "MeetingNote"("roomId");
CREATE INDEX "MeetingTranscript_roomId_timestamp_idx" ON "MeetingTranscript"("roomId", "timestamp");

ALTER TABLE "MeetingTranscript" ADD CONSTRAINT "MeetingTranscript_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
