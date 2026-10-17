import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { Database } from "@/db";
import { oauthAccessToken, oauthConsent, oauthRefreshToken, preferences } from "@/db/schema";
import { savePreferences } from "@/lib/preferences";

/*
 * Claude's access to a Taskly account: the OAuth grants it got through the
 * consent screen. Access tokens are JWTs checked against the JWKS without a
 * database lookup, so deleting rows isn't enough to cut access right away:
 * the MCP endpoint also refuses tokens issued before the user disconnected.
 */

/** Whether Claude (or another MCP client) still holds a grant the user could revoke. */
export async function hasClaudeAccess(db: Database, userId: string, now = new Date()): Promise<boolean> {
  const [consent] = await db.select({ id: oauthConsent.id }).from(oauthConsent).where(eq(oauthConsent.userId, userId)).limit(1);
  if (consent) return true;
  const [refresh] = await db
    .select({ id: oauthRefreshToken.id })
    .from(oauthRefreshToken)
    .where(
      and(
        eq(oauthRefreshToken.userId, userId),
        isNull(oauthRefreshToken.revoked),
        or(isNull(oauthRefreshToken.expiresAt), gt(oauthRefreshToken.expiresAt, now)),
      ),
    )
    .limit(1);
  return !!refresh;
}

/** Revokes every grant and makes the health check show Claude as not connected. */
export async function disconnectClaude(db: Database, userId: string, now = new Date()): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(oauthAccessToken).where(eq(oauthAccessToken.userId, userId));
    await tx.delete(oauthRefreshToken).where(eq(oauthRefreshToken.userId, userId));
    await tx.delete(oauthConsent).where(eq(oauthConsent.userId, userId));
  });
  await savePreferences(db, userId, { claudeDisconnectedAt: now, claudeSeenAt: null, claudeSources: null });
}

/**
 * A token issued at or before the disconnect is refused. JWT `iat` is in
 * seconds, so a token from the same second counts as before: reconnecting
 * takes a consent screen, never less than a second.
 */
export function isRevoked(issuedAt: unknown, disconnectedAt: Date | null): boolean {
  if (!disconnectedAt) return false;
  if (typeof issuedAt !== "number") return true;
  return issuedAt <= Math.floor(disconnectedAt.getTime() / 1000);
}

/** The disconnect time for a user, read on every MCP request. */
export async function getDisconnectedAt(db: Database, userId: string): Promise<Date | null> {
  const [row] = await db
    .select({ at: preferences.claudeDisconnectedAt })
    .from(preferences)
    .where(eq(preferences.userId, userId));
  return row?.at ?? null;
}
