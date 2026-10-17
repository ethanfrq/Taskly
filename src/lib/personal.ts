import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import type { Database } from "@/db";
import { instanceSecrets } from "@/db/schema";
import { isPersonalInstance } from "@/lib/auth/allowed-emails";

/*
 * A personal instance (TASKLY_ALLOWED_EMAILS set) should deploy with two
 * clicks: a database and, for reminders, QStash. The secrets it needs and
 * nobody else uses (the auth secret, the push keys) are generated on first
 * start and kept in the database. Values set in the environment always win.
 * Trade-off: whoever can read the database can read these too, but they can
 * already read everything they protect.
 */

/** A stored secret, generated on first use. Concurrent first starts agree: the first insert wins. */
export async function instanceSecret(db: Database, name: string, generate: () => string): Promise<string> {
  await db.insert(instanceSecrets).values({ name, value: generate() }).onConflictDoNothing();
  const [row] = await db.select({ value: instanceSecrets.value }).from(instanceSecrets).where(eq(instanceSecrets.name, name));
  return row.value;
}

/**
 * Fills the missing secrets of a personal instance into `env`, from the
 * database. Returns what it filled. Does nothing for a public instance.
 */
export async function loadPersonalSecrets(db: Database, env: Record<string, string | undefined> = process.env): Promise<string[]> {
  if (!isPersonalInstance(env)) return [];
  const filled: string[] = [];
  if (!env.BETTER_AUTH_SECRET) {
    env.BETTER_AUTH_SECRET = await instanceSecret(db, "better_auth_secret", () => randomBytes(32).toString("base64"));
    filled.push("BETTER_AUTH_SECRET");
  }
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !env.VAPID_PRIVATE_KEY) {
    const keys = JSON.parse(await instanceSecret(db, "vapid", () => JSON.stringify(webpush.generateVAPIDKeys()))) as {
      publicKey: string;
      privateKey: string;
    };
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = keys.publicKey;
    env.VAPID_PRIVATE_KEY = keys.privateKey;
    filled.push("VAPID keys");
  }
  return filled;
}
