import "server-only";
import { Client } from "@upstash/qstash";
import { getDb } from "@/db";
import { sendToUser } from "@/lib/push/send";
import { getBaseUrl } from "@/lib/url";
import type { ReminderDeps } from "./service";

let qstash: Client | null | undefined;

function getQStash(): Client | null {
  if (qstash === undefined) qstash = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;
  return qstash;
}

/** Whether exact-time delivery goes through QStash (otherwise the sweep). */
export const usesQStash = () => !!process.env.QSTASH_TOKEN;

/**
 * Production wiring: push through web-push, wake-ups through QStash when
 * configured. Without QStash, the sweep (local scheduler or a cron) sends
 * due reminders.
 */
export function reminderDeps(): ReminderDeps {
  const db = getDb();
  return {
    db,
    send: (userId, payload) => sendToUser(db, userId, payload),
    schedule: async (reminder) => {
      const client = getQStash();
      if (!client) return;
      await client.publishJSON({
        url: `${getBaseUrl()}/api/reminders/fire`,
        body: { reminderId: reminder.id },
        notBefore: Math.floor(reminder.dueAt.getTime() / 1000),
        deduplicationId: `${reminder.id}-${reminder.dueAt.getTime()}`,
      });
    },
  };
}
