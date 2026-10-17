import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { instanceSecrets } from "@/db/schema";
import { createTestDb } from "@/test/db";
import { loadPersonalSecrets } from "./personal";

let db: Database;
const personal = () => ({ TASKLY_ALLOWED_EMAILS: "ethan@example.com" }) as Record<string, string | undefined>;

beforeEach(async () => {
  db = await createTestDb();
});

describe("loadPersonalSecrets", () => {
  it("leaves a public instance alone", async () => {
    const env: Record<string, string | undefined> = {};
    expect(await loadPersonalSecrets(db, env)).toEqual([]);
    expect(env).toEqual({});
    expect(await db.select().from(instanceSecrets)).toHaveLength(0);
  });

  it("generates the auth secret and push keys once, and every instance gets the same", async () => {
    const first = personal();
    expect(await loadPersonalSecrets(db, first)).toEqual(["BETTER_AUTH_SECRET", "VAPID keys"]);
    expect(Buffer.from(first.BETTER_AUTH_SECRET!, "base64")).toHaveLength(32);
    expect(first.NEXT_PUBLIC_VAPID_PUBLIC_KEY).toMatch(/^[A-Za-z0-9_-]{87}$/);
    expect(first.VAPID_PRIVATE_KEY).toMatch(/^[A-Za-z0-9_-]{43}$/);

    // Two cold starts at once still agree.
    const [second, third] = [personal(), personal()];
    await Promise.all([loadPersonalSecrets(db, second), loadPersonalSecrets(db, third)]);
    for (const env of [second, third]) {
      expect(env.BETTER_AUTH_SECRET).toBe(first.BETTER_AUTH_SECRET);
      expect(env.VAPID_PRIVATE_KEY).toBe(first.VAPID_PRIVATE_KEY);
    }
    expect(await db.select().from(instanceSecrets)).toHaveLength(2);
  });

  it("never overrides what the environment already sets", async () => {
    const env = { ...personal(), BETTER_AUTH_SECRET: "set-by-the-owner", NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" };
    expect(await loadPersonalSecrets(db, env)).toEqual([]);
    expect(env.BETTER_AUTH_SECRET).toBe("set-by-the-owner");
    expect(await db.select().from(instanceSecrets)).toHaveLength(0);
  });
});
