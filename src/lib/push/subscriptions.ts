import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { pushSubscriptions } from "@/db/schema";

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Saves a device's subscription. An endpoint moving to another account is reassigned. */
export async function saveSubscription(
  db: Database,
  userId: string,
  subscription: BrowserSubscription,
  userAgent: string | null,
): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({
      id: crypto.randomUUID(),
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent },
    });
}

export async function removeSubscription(db: Database, userId: string, endpoint: string): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export async function listSubscriptions(db: Database, userId: string) {
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
}
