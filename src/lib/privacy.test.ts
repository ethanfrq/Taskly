import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { lists, preferences, pushSubscriptions, reminders, session, tags, tasks, user } from "@/db/schema";
import { savePreferences } from "@/lib/preferences";
import { saveSubscription } from "@/lib/push/subscriptions";
import { createList, createTask } from "@/lib/tasks/service";
import { createTestDb } from "@/test/db";
import { deleteUserData, exportUserData } from "./privacy";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: "sam", name: "Sam", email: "sam@example.com" },
    { id: "kim", name: "Kim", email: "kim@example.com" },
  ]);
  for (const id of ["sam", "kim"]) {
    await savePreferences(db, id, { accent: "#FF9500" });
    const list = await createList(db, id, `${id}'s list`);
    await createTask(db, id, { title: `${id}'s task`, listId: list.id, tags: ["work"], dueDate: "2026-10-16", dueTime: "09:00" });
    await saveSubscription(db, id, { endpoint: `https://push.example/${id}`, keys: { p256dh: "secret-p256dh", auth: "secret-auth" } }, "iPhone");
  }
  await db.insert(session).values({ id: "s1", token: "secret-session-token", userId: "sam", expiresAt: new Date(Date.now() + 1e9) });
});

describe("exportUserData", () => {
  it("contains the user's data and nobody else's", async () => {
    const data = await exportUserData(db, "sam");
    expect(data.account?.email).toBe("sam@example.com");
    expect(data.tasks.map((t) => [t.title, t.tags])).toEqual([["sam's task", ["work"]]]);
    expect(data.lists.map((l) => l.name)).toEqual(["sam's list"]);
    expect(data.preferences?.accent).toBe("#FF9500");
    expect(JSON.stringify(data)).not.toContain("kim");
  });

  it("leaves secrets out", async () => {
    const text = JSON.stringify(await exportUserData(db, "sam"));
    expect(text).not.toContain("secret-session-token");
    expect(text).not.toContain("secret-p256dh");
    expect(text).not.toContain("secret-auth");
  });
});

describe("deleteUserData", () => {
  it("removes everything attached to the account and nothing else", async () => {
    await deleteUserData(db, "sam");
    for (const [table, column] of [
      [tasks, tasks.userId],
      [lists, lists.ownerId],
      [tags, tags.userId],
      [preferences, preferences.userId],
      [pushSubscriptions, pushSubscriptions.userId],
      [reminders, reminders.userId],
      [session, session.userId],
    ] as const) {
      expect(await db.select().from(table).where(eq(column, "sam"))).toHaveLength(0);
    }
    expect(await db.select().from(tasks).where(eq(tasks.userId, "kim"))).toHaveLength(1);
  });
});
