import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { user } from "@/db/schema";
import { getPreferences, savePreferences } from "@/lib/preferences";
import { createList, getLatestImport } from "@/lib/tasks/service";
import { createTestDb } from "@/test/db";
import { type McpContext, addEvents, addTasks, completeTask, getToday, reportConnections } from "./handlers";

let db: Database;
let ctx: McpContext;
let changed: string[];
const clock = new Date("2026-10-16T07:00:00Z"); // 09:00 in Paris

beforeEach(async () => {
  db = await createTestDb();
  changed = [];
  await db.insert(user).values({ id: "sam", name: "Sam", email: "sam@example.com" });
  await savePreferences(db, "sam", { timeZone: "Europe/Paris" });
  ctx = { db, userId: "sam", now: () => clock, onTaskChanged: async (id) => void changed.push(id) };
});

describe("add_tasks", () => {
  it("adds a batch from Claude with sources, on today by default", async () => {
    await createList(db, "sam", "Travail");
    const result = await addTasks(ctx, [
      { title: "Reply to Sarah", due_time: "11:00", priority: 2, source: { kind: "gmail", url: "https://mail.example/1" } },
      { title: "Review the PR", list: "travail", source: { kind: "slack" } },
    ]);
    expect(result.created).toHaveLength(2);
    expect(changed).toHaveLength(2);

    const today = await getToday(ctx);
    expect(today.today).toBe("2026-10-16");
    expect(today.to_do.map((t) => [t.title, t.list, t.source?.kind, t.added_by_claude])).toEqual([
      ["Reply to Sarah", null, "gmail", true],
      ["Review the PR", "Travail", "slack", true],
    ]);

    const banner = await getLatestImport(db, "sam", new Date(0));
    expect(banner?.count).toBe(2);
  });

  it("skips duplicates when Claude prepares the day twice", async () => {
    await addTasks(ctx, [{ title: "Reply to Sarah", source: { kind: "gmail", url: "https://mail.example/1" } }]);
    const again = await addTasks(ctx, [
      { title: "Answer Sarah", source: { kind: "gmail", url: "https://mail.example/1" } },
      { title: "  reply to   SARAH " },
      { title: "Book the venue" },
    ]);
    expect(again.created.map((t) => t.title)).toEqual(["Book the venue"]);
    expect(again.skipped).toHaveLength(2);
  });
});

describe("other tools", () => {
  it("completes tasks and reports the next occurrence", async () => {
    const { created } = await addTasks(ctx, [{ title: "Standup", recurrence: "weekdays", due_time: "09:30" }]);
    const result = await completeTask(ctx, created[0].id);
    expect(result).toMatchObject({ done: true, next_occurrence: "2026-10-19" });
  });

  it("stores events without duplicating resent ones", async () => {
    const event = { title: "Démo client", start: "2026-10-16T14:00:00+02:00", end: "2026-10-16T15:00:00+02:00", id: "cal-1" };
    await addEvents(ctx, [event]);
    await addEvents(ctx, [{ ...event, title: "Démo client Acme" }]);
    const today = await getToday(ctx);
    expect(today.events).toEqual([{ title: "Démo client Acme", start: "14:00", end: "15:00", all_day: false, location: null }]);
  });

  it("records the connectors Claude sees for the health check", async () => {
    await reportConnections(ctx, ["gmail", "calendar", "gmail"]);
    const prefs = await getPreferences(db, "sam");
    expect(prefs.claudeSources).toBe("gmail,calendar");
    expect(prefs.claudeSeenAt).toEqual(clock);
  });
});
