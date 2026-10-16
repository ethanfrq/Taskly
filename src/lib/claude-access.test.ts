import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken, user } from "@/db/schema";
import { getPreferences, savePreferences } from "@/lib/preferences";
import { createTestDb } from "@/test/db";
import { disconnectClaude, getDisconnectedAt, hasClaudeAccess, isRevoked } from "./claude-access";

let db: Database;
const NOW = new Date("2026-10-17T08:00:00.400Z");

async function grant(userId: string) {
  const scopes = ["tasks:read", "tasks:write"];
  await db.insert(oauthConsent).values({ id: `consent-${userId}`, clientId: "claude", userId, scopes });
  await db.insert(oauthRefreshToken).values({ id: `refresh-${userId}`, token: `rt-${userId}`, clientId: "claude", userId, scopes });
  await db.insert(oauthAccessToken).values({ id: `access-${userId}`, token: `at-${userId}`, clientId: "claude", userId, scopes, refreshId: `refresh-${userId}` });
}

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: "sam", name: "Sam", email: "sam@example.com" },
    { id: "kim", name: "Kim", email: "kim@example.com" },
  ]);
  await db.insert(oauthClient).values({ id: "c1", clientId: "claude", redirectUris: ["https://claude.ai/api/mcp/auth_callback"] });
  await grant("sam");
  await grant("kim");
  await savePreferences(db, "sam", { claudeSeenAt: NOW, claudeSources: "gmail,calendar" });
});

describe("disconnectClaude", () => {
  it("revokes the user's grants, and only theirs", async () => {
    expect(await hasClaudeAccess(db, "sam")).toBe(true);
    await disconnectClaude(db, "sam", NOW);

    expect(await hasClaudeAccess(db, "sam")).toBe(false);
    for (const [table, column] of [
      [oauthConsent, oauthConsent.userId],
      [oauthRefreshToken, oauthRefreshToken.userId],
      [oauthAccessToken, oauthAccessToken.userId],
    ] as const) {
      expect(await db.select().from(table).where(eq(column, "sam"))).toHaveLength(0);
      expect(await db.select().from(table).where(eq(column, "kim"))).toHaveLength(1);
    }
    expect(await hasClaudeAccess(db, "kim")).toBe(true);
  });

  it("resets the health check and remembers when", async () => {
    await disconnectClaude(db, "sam", NOW);
    const prefs = await getPreferences(db, "sam");
    expect(prefs.claudeSeenAt).toBeNull();
    expect(prefs.claudeSources).toBeNull();
    expect(await getDisconnectedAt(db, "sam")).toEqual(NOW);
    expect(await getDisconnectedAt(db, "kim")).toBeNull();
  });
});

describe("isRevoked", () => {
  const second = Math.floor(NOW.getTime() / 1000);

  it("accepts every token while the user never disconnected", () => {
    expect(isRevoked(second - 3600, null)).toBe(false);
  });

  it("refuses tokens issued before or in the same second as the disconnect", () => {
    expect(isRevoked(second - 60, NOW)).toBe(true);
    expect(isRevoked(second, NOW)).toBe(true);
    expect(isRevoked(second + 1, NOW)).toBe(false);
  });

  it("refuses a token without iat once the user disconnected", () => {
    expect(isRevoked(undefined, NOW)).toBe(true);
  });
});

describe("hasClaudeAccess", () => {
  it("ignores refresh tokens that are revoked or expired", async () => {
    await db.delete(oauthConsent).where(eq(oauthConsent.userId, "kim"));
    await db.update(oauthRefreshToken).set({ revoked: NOW }).where(eq(oauthRefreshToken.userId, "kim"));
    expect(await hasClaudeAccess(db, "kim", NOW)).toBe(false);

    await db.update(oauthRefreshToken).set({ revoked: null, expiresAt: new Date(NOW.getTime() - 1) }).where(eq(oauthRefreshToken.userId, "kim"));
    expect(await hasClaudeAccess(db, "kim", NOW)).toBe(false);
  });
});
