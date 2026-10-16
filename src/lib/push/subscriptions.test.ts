import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { user } from "@/db/schema";
import { createTestDb } from "@/test/db";
import { listSubscriptions, removeSubscription, saveSubscription } from "./subscriptions";

const sub = (endpoint: string) => ({ endpoint, keys: { p256dh: "p256dh-key", auth: "auth-key" } });
let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: "sam", name: "Sam", email: "sam@example.com" },
    { id: "kim", name: "Kim", email: "kim@example.com" },
  ]);
});

describe("push subscriptions", () => {
  it("keeps one row per device and moves it when another account signs in", async () => {
    await saveSubscription(db, "sam", sub("https://push.example/a"), "iPhone");
    await saveSubscription(db, "sam", sub("https://push.example/a"), "iPhone");
    expect(await listSubscriptions(db, "sam")).toHaveLength(1);

    await saveSubscription(db, "kim", sub("https://push.example/a"), "iPhone");
    expect(await listSubscriptions(db, "sam")).toHaveLength(0);
    expect(await listSubscriptions(db, "kim")).toHaveLength(1);
  });

  it("only removes the caller's own device", async () => {
    await saveSubscription(db, "sam", sub("https://push.example/b"), null);
    await removeSubscription(db, "kim", "https://push.example/b");
    expect(await listSubscriptions(db, "sam")).toHaveLength(1);
    await removeSubscription(db, "sam", "https://push.example/b");
    expect(await listSubscriptions(db, "sam")).toHaveLength(0);
  });
});
