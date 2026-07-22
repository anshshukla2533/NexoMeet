CREATE TABLE IF NOT EXISTS "Schedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "hostId" TEXT NOT NULL,
    "roomSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "roomSlug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Schedule_roomSlug_key" ON "Schedule"("roomSlug");
CREATE INDEX IF NOT EXISTS "Schedule_hostId_startTime_idx" ON "Schedule"("hostId", "startTime");
DO $$ BEGIN
  ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
