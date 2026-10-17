import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import {
  type TaskSnapshot,
  claudeChanges,
  events,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  passkey,
  preferences,
  pushSubscriptions,
  rateLimit,
  reminders,
  session,
  tasks,
  user,
  verification,
} from "@/db/schema";
import { createTestDb } from "@/test/db";
import { type CleanupCounts, cleanupDatabase } from "./housekeeping";

const NOW = new Date("2026-10-17T10:00:00Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * HOUR);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const NOTHING: CleanupCounts = { rateLimits: 0, reminders: 0, claudeChanges: 0, verifications: 0, oauthClients: 0 };

let db: Database;

/** The ids left in a table, sorted. */
const ids = async (table: PgTable & { id: PgColumn }) =>
  (await db.select({ id: table.id }).from(table)).map((r) => String(r.id)).sort();

const client = (id: string, createdAt: Date | null) => ({ id, clientId: `client-${id}`, redirectUris: ["https://claude.ai/callback"], createdAt });

const snapshot: TaskSnapshot = {
  id: "quote",
  listId: null,
  assigneeId: null,
  title: "Send the quote",
  notes: null,
  dueDate: "2026-09-01",
  dueTime: null,
  priority: 0,
  position: 0,
  sourceKind: "gmail",
  sourceUrl: null,
  sourceLabel: null,
  importBatchId: null,
  createdAt: daysAgo(40).toISOString(),
  tagNames: [],
};

const change = (id: string, createdAt: Date) => ({
  id,
  userId: "sam",
  batchId: `batch-${id}`,
  position: 0,
  taskId: "quote",
  action: "update" as const,
  title: "Send the quote",
  reason: "Dupont asked for it by Monday",
  before: snapshot,
  createdAt,
});

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values({ id: "sam", name: "Sam", email: "sam@example.com" });
});

describe("cleanupDatabase", () => {
  it("drops rate-limit counters not touched for a day", async () => {
    await db.insert(rateLimit).values([
      { id: "stale", key: "203.0.113.7|/email-otp/send-verification-otp", count: 5, lastRequest: hoursAgo(25).getTime() },
      { id: "edge", key: "198.51.100.4|/oauth2/register", count: 1, lastRequest: hoursAgo(24).getTime() },
      { id: "fresh", key: "email-code|3f2a", count: 2, lastRequest: hoursAgo(1).getTime() },
    ]);
    expect(await cleanupDatabase(db, NOW)).toEqual({ ...NOTHING, rateLimits: 1 });
    expect(await ids(rateLimit)).toEqual(["edge", "fresh"]);
  });

  it("drops reminders sent or cancelled over 30 days ago, never pending ones", async () => {
    const base = { userId: "sam", kind: "briefing" as const };
    await db.insert(reminders).values([
      { id: "pending-old", ...base, dueAt: daysAgo(60) },
      { id: "sent-old", ...base, dueAt: daysAgo(31), sentAt: daysAgo(31) },
      { id: "sent-recent", ...base, dueAt: daysAgo(29), sentAt: daysAgo(29) },
      { id: "cancelled-old", ...base, dueAt: daysAgo(31), cancelledAt: daysAgo(31) },
      { id: "cancelled-recent", ...base, dueAt: hoursAgo(1), cancelledAt: hoursAgo(1) },
    ]);
    expect(await cleanupDatabase(db, NOW)).toEqual({ ...NOTHING, reminders: 2 });
    expect(await ids(reminders)).toEqual(["cancelled-recent", "pending-old", "sent-recent"]);
  });

  it("drops what Claude changed over 30 days ago", async () => {
    await db.insert(claudeChanges).values([change("old", daysAgo(31)), change("recent", daysAgo(29)), change("today", hoursAgo(2))]);
    expect(await cleanupDatabase(db, NOW)).toEqual({ ...NOTHING, claudeChanges: 1 });
    expect(await ids(claudeChanges)).toEqual(["recent", "today"]);
  });

  it("drops expired verification rows, such as used-up sign-in codes", async () => {
    await db.insert(verification).values([
      { id: "expired", identifier: "sign-in-otp-sam@example.com", value: "123456:0", expiresAt: new Date(NOW.getTime() - 60_000) },
      { id: "valid", identifier: "sign-in-otp-kim@example.com", value: "654321:0", expiresAt: new Date(NOW.getTime() + 9 * 60_000) },
    ]);
    expect(await cleanupDatabase(db, NOW)).toEqual({ ...NOTHING, verifications: 1 });
    expect(await ids(verification)).toEqual(["valid"]);
  });

  it("drops OAuth clients registered over 30 days ago that nothing refers to", async () => {
    await db.insert(oauthClient).values([
      client("abandoned", daysAgo(31)),
      client("consented", daysAgo(31)),
      client("refreshing", daysAgo(31)),
      client("accessing", daysAgo(31)),
      client("fresh", hoursAgo(2)),
      client("undated", null),
    ]);
    await db.insert(oauthConsent).values({ id: "consent", clientId: "client-consented", userId: "sam", scopes: ["tasks:read"] });
    // A revoked refresh token is still a reference: the grant's history stays with its client.
    await db.insert(oauthRefreshToken).values({
      id: "refresh",
      token: "refresh-token",
      clientId: "client-refreshing",
      userId: "sam",
      scopes: ["tasks:read"],
      revoked: daysAgo(10),
    });
    await db.insert(oauthAccessToken).values({ id: "access", token: "access-token", clientId: "client-accessing", userId: "sam", scopes: ["tasks:read"] });

    expect(await cleanupDatabase(db, NOW)).toEqual({ ...NOTHING, oauthClients: 1 });
    expect(await ids(oauthClient)).toEqual(["accessing", "consented", "fresh", "refreshing", "undated"]);
    expect(await ids(oauthConsent)).toEqual(["consent"]);
    expect(await ids(oauthRefreshToken)).toEqual(["refresh"]);
    expect(await ids(oauthAccessToken)).toEqual(["access"]);
  });

  it("leaves fresh rows alone, and says so", async () => {
    await db.insert(rateLimit).values({ id: "rl", key: "203.0.113.7|/sign-in/email", count: 1, lastRequest: hoursAgo(23).getTime() });
    await db.insert(reminders).values([
      { id: "pending", userId: "sam", kind: "review", dueAt: hoursAgo(-8) },
      { id: "sent", userId: "sam", kind: "briefing", dueAt: daysAgo(1), sentAt: daysAgo(1) },
    ]);
    await db.insert(claudeChanges).values(change("today", hoursAgo(1)));
    await db.insert(verification).values({ id: "code", identifier: "sign-in-otp-sam@example.com", value: "123456:0", expiresAt: hoursAgo(-1) });
    await db.insert(oauthClient).values(client("claude", daysAgo(29)));

    expect(await cleanupDatabase(db, NOW)).toEqual(NOTHING);
    expect(await ids(rateLimit)).toEqual(["rl"]);
    expect(await ids(reminders)).toEqual(["pending", "sent"]);
    expect(await ids(claudeChanges)).toEqual(["today"]);
    expect(await ids(verification)).toEqual(["code"]);
    expect(await ids(oauthClient)).toEqual(["claude"]);
  });

  it("never touches user data, however old", async () => {
    await db.insert(tasks).values({ id: "task", userId: "sam", title: "Taxes 2025", createdAt: daysAgo(400), completedAt: daysAgo(399) });
    await db.insert(events).values({ id: "event", userId: "sam", title: "Kick-off", startsAt: daysAgo(400), createdAt: daysAgo(400) });
    await db.insert(preferences).values({ userId: "sam", onboardedAt: daysAgo(400), updatedAt: daysAgo(400) });
    await db.insert(session).values({ id: "session", userId: "sam", token: "expired-session", expiresAt: daysAgo(300), createdAt: daysAgo(310) });
    await db.insert(passkey).values({
      id: "passkey",
      userId: "sam",
      publicKey: "pk",
      credentialID: "cred",
      counter: 0,
      deviceType: "singleDevice",
      backedUp: false,
      createdAt: daysAgo(400),
    });
    await db.insert(pushSubscriptions).values({ id: "push", userId: "sam", endpoint: "https://push.example/1", p256dh: "p", auth: "a", createdAt: daysAgo(400) });

    expect(await cleanupDatabase(db, NOW)).toEqual(NOTHING);
    expect(await ids(tasks)).toEqual(["task"]);
    expect(await ids(events)).toEqual(["event"]);
    expect(await ids(session)).toEqual(["session"]);
    expect(await ids(passkey)).toEqual(["passkey"]);
    expect(await ids(pushSubscriptions)).toEqual(["push"]);
    expect((await db.select().from(preferences)).map((p) => p.userId)).toEqual(["sam"]);
  });
});
