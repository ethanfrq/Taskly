import "server-only";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import type { Database } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { listSubscriptions } from "./subscriptions";
import { getVapidKeys } from "./vapid";

/** What the service worker shows (public/sw.js). */
export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  /** App icon badge count; 0 clears it. */
  badge?: number;
  reminderId?: string;
  actions?: { action: string; title: string }[];
};

export type SendResult = { sent: number; removed: number; failed: number };

/**
 * Sends a notification to every device of a user. Subscriptions the push
 * service reports as gone (404/410) are deleted.
 */
export async function sendToUser(db: Database, userId: string, payload: PushPayload): Promise<SendResult> {
  const keys = getVapidKeys();
  if (!keys) throw new Error("Push is not configured: set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  const subscriptions = await listSubscriptions(db, userId);
  const result: SendResult = { sent: 0, removed: 0, failed: 0 };

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { vapidDetails: keys, TTL: 60 * 60, urgency: "high", topic: payload.tag?.slice(0, 32) },
        );
        result.sent++;
        await db.update(pushSubscriptions).set({ lastSuccessAt: new Date() }).where(eq(pushSubscriptions.id, sub.id));
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          result.removed++;
        } else {
          result.failed++;
          console.error(`Push to ${new URL(sub.endpoint).host} failed`, status ?? error);
        }
      }
    }),
  );
  return result;
}
