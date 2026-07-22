import { db } from '@/lib/db';

/** Creates a minimal local user record when Clerk's webhook has not arrived yet. */
export async function ensureDatabaseUser(userId: string) {
  return db.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@pending.nexomeet.local` },
  });
}
