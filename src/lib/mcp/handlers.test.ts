import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { user } from "@/db/schema";
import { getPreferences, savePreferences } from "@/lib/preferences";
import { createList, getLatestImport } from "@/lib/tasks/service";
import { createTestDb } from "@/test/db";
import { updateTask } from "@/lib/tasks/service";
import { type McpContext, addEvents, addTasks, completeTask, getClaudeTasks, getToday, refreshTasks, removeCalendarEvents, reportConnections } from "./handlers";

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

describe("refresh", () => {
  it("shows Claude its tasks, flags the user's edits, and resyncs reminders after a change", async () => {
    const { created } = await addTasks(ctx, [
      { title: "Reply to Sarah", source: { kind: "gmail", url: "https://mail.example/1" } },
      { title: "Send the quote", due_time: "10:30", source: { kind: "gmail", url: "https://mail.example/2" } },
      { title: "Prepare the demo", source: { kind: "calendar" } },
    ]);
    const [reply, quote, demo] = created;
    await updateTask(db, "sam", demo.id, { priority: 2 }); // edited in the app
    changed = [];

    const listed = await getClaudeTasks(ctx);
    // By day, then time: the timed task first.
    expect(listed.tasks.map((t) => [t.title, t.source?.url ?? null, t.edited_by_user])).toEqual([
      ["Send the quote", "https://mail.example/2", false],
      ["Reply to Sarah", "https://mail.example/1", false],
      ["Prepare the demo", null, true],
    ]);

    const result = await refreshTasks(ctx, [
      { task_id: reply.id, action: "complete", reason: "Tu as répondu hier soir" },
      { task_id: quote.id, action: "update", reason: "Dupont le veut pour 14h", due_time: "14:00" },
      { task_id: demo.id, action: "remove", reason: "Démo annulée" },
    ]);
    expect(result.applied).toEqual([
      { task_id: reply.id, action: "complete" },
      { task_id: quote.id, action: "update" },
    ]);
    expect(result.skipped).toEqual([{ task_id: demo.id, reason: "edited_by_user" }]);
    expect(changed).toEqual([reply.id, quote.id]);
    expect((await getToday(ctx)).to_do.map((t) => [t.title, t.due_time])).toEqual([
      ["Send the quote", "14:00"],
      ["Prepare the demo", null],
    ]);
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
    expect(today.events).toEqual([{ id: "cal-1", title: "Démo client Acme", start: "14:00", end: "15:00", all_day: false, location: null }]);
  });

  it("forgets the day's events Claude no longer sends with replace_day", async () => {
    await addEvents(ctx, [
      { title: "Démo", start: "2026-10-16T14:00:00+02:00", id: "cal-1" },
      { title: "Late call", start: "2026-10-16T23:30:00+02:00", id: "cal-2" },
      { title: "Tomorrow", start: "2026-10-17T00:30:00+02:00", id: "cal-3" },
    ]);
    await db.insert(user).values({ id: "kim", name: "Kim", email: "kim@example.com" });
    await addEvents({ ...ctx, userId: "kim" }, [{ title: "Kim's meeting", start: "2026-10-16T10:00:00+02:00", id: "cal-1" }]);

    // The late call was cancelled: Claude resends the rest of the day.
    const result = await addEvents(ctx, [{ title: "Démo", start: "2026-10-16T14:00:00+02:00", id: "cal-1" }], "2026-10-16");
    expect(result).toEqual({ saved: 1, removed: 1 });
    expect((await getToday(ctx)).events.map((e) => e.title)).toEqual(["Démo"]);

    // Nothing left that day; other days and other users are untouched.
    expect(await addEvents(ctx, [], "2026-10-16")).toEqual({ saved: 0, removed: 1 });
    const tomorrow = await getToday({ ...ctx, now: () => new Date("2026-10-17T07:00:00Z") });
    expect(tomorrow.events.map((e) => e.title)).toEqual(["Tomorrow"]);
    expect((await getToday({ ...ctx, userId: "kim" })).events).toHaveLength(1);
  });

  it("removes a cancelled event by its calendar id or Taskly's", async () => {
    await addEvents(ctx, [
      { title: "Démo", start: "2026-10-16T14:00:00+02:00", id: "cal-1" },
      { title: "No calendar id", start: "2026-10-16T16:00:00+02:00" },
    ]);
    const [, untracked] = (await getToday(ctx)).events;
    expect(await removeCalendarEvents(ctx, ["cal-1", untracked.id, "unknown"])).toEqual({ removed: 2 });
    expect((await getToday(ctx)).events).toEqual([]);
  });

  it("records the connectors Claude sees for the health check", async () => {
    await reportConnections(ctx, ["gmail", "calendar", "gmail"]);
    const prefs = await getPreferences(db, "sam");
    expect(prefs.claudeSources).toBe("gmail,calendar");
    expect(prefs.claudeSeenAt).toEqual(clock);
  });
});
