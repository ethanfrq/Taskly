import { and, eq, lt, notExists, or, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Database } from "@/db";
import {
  claudeChanges,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  rateLimit,
  reminders,
  verification,
} from "@/db/schema";

/*
 * Database housekeeping: deletes the bookkeeping rows nothing reads any more,
 * so the database doesn't grow forever. Only bookkeeping goes. User data
 * (tasks, lists, events, preferences, sessions, passkeys, push subscriptions)
 * is never touched here: users export or delete it themselves in Settings.
 * Run once a day: GET /api/housekeeping from a cron, or the internal scheduler
 * (src/instrumentation.ts).
 */

const DAY = 24 * 60 * 60 * 1000;

/** How long each kind of row is kept after it stopped being useful. */
export const RETENTION = {
  /** Rate-limit counters: the longest window is one hour (src/lib/auth/quota.ts, src/lib/auth/config.ts). */
  rateLimitMs: DAY,
  /** Sent or cancelled reminders: a notification's buttons look its reminder up, never a month later. */
  remindersMs: 30 * DAY,
  /** What Claude changed: the Today banner shows today's refresh and undoes it; older rows are history nobody reads. */
  claudeChangesMs: 30 * DAY,
  /** OAuth clients registered but never connected, or disconnected since: the client re-registers if it comes back. */
  oauthClientsMs: 30 * DAY,
} as const;

export type CleanupCounts = {
  rateLimits: number;
  reminders: number;
  claudeChanges: number;
  verifications: number;
  oauthClients: number;
};

/**
 * Deletes, and counts:
 * - `rate_limit` counters not touched for a day;
 * - `reminders` sent or cancelled over 30 days ago (pending ones stay, whatever their age);
 * - `claude_changes` older than 30 days;
 * - `verification` rows (sign-in codes, OAuth state) past their expiry;
 * - `oauth_client` rows over 30 days old that no consent, refresh token or
 *   access token refers to. A revoked token still counts as a reference, so
 *   a client is only dropped once its grants are gone (disconnectClaude
 *   deletes them), or if it never got any.
 */
export async function cleanupDatabase(db: Database, now = new Date()): Promise<CleanupCounts> {
  const t = now.getTime();
  const before = (ms: number) => new Date(t - ms);

  const rateLimits = await db
    .delete(rateLimit)
    .where(lt(rateLimit.lastRequest, t - RETENTION.rateLimitMs))
    .returning({ id: rateLimit.id });

  const remindersCutoff = before(RETENTION.remindersMs);
  const sentOrCancelled = await db
    .delete(reminders)
    .where(or(lt(reminders.sentAt, remindersCutoff), lt(reminders.cancelledAt, remindersCutoff)))
    .returning({ id: reminders.id });

  const changes = await db
    .delete(claudeChanges)
    .where(lt(claudeChanges.createdAt, before(RETENTION.claudeChangesMs)))
    .returning({ id: claudeChanges.id });

  const verifications = await db.delete(verification).where(lt(verification.expiresAt, now)).returning({ id: verification.id });

  // Rows with no creation date are kept: their age is unknown.
  const unreferenced = (table: PgTable, clientId: PgColumn) =>
    notExists(db.select({ one: sql`1` }).from(table).where(eq(clientId, oauthClient.clientId)));
  const oauthClients = await db
    .delete(oauthClient)
    .where(
      and(
        lt(oauthClient.createdAt, before(RETENTION.oauthClientsMs)),
        unreferenced(oauthConsent, oauthConsent.clientId),
        unreferenced(oauthRefreshToken, oauthRefreshToken.clientId),
        unreferenced(oauthAccessToken, oauthAccessToken.clientId),
      ),
    )
    .returning({ id: oauthClient.id });

  return {
    rateLimits: rateLimits.length,
    reminders: sentOrCancelled.length,
    claudeChanges: changes.length,
    verifications: verifications.length,
    oauthClients: oauthClients.length,
  };
}
