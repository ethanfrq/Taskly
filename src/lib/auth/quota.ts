import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Database } from "@/db";
import { rateLimit } from "@/db/schema";

/** At most 5 sign-in codes per address per hour, whatever the sender's IP. */
export const EMAIL_CODE_QUOTA = { max: 5, windowMs: 60 * 60 * 1000 };

/**
 * Counts one sign-in code for this address and says whether it may be sent.
 * Per-IP limits stop one machine; this stops many machines from flooding one
 * inbox through Taskly. The address is stored hashed, in a fixed window, with
 * a single atomic upsert so concurrent requests can't both slip through.
 */
export async function consumeEmailCodeQuota(
  db: Database,
  email: string,
  now = Date.now(),
  quota = EMAIL_CODE_QUOTA,
): Promise<boolean> {
  const key = `email-code|${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}`;
  const expired = sql`${rateLimit.lastRequest} <= ${now - quota.windowMs}`;
  const [row] = await db
    .insert(rateLimit)
    .values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: sql`case when ${expired} then ${now} else ${rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: rateLimit.count });
  return row.count <= quota.max;
}
