import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { tasks, user } from "@/db/schema";
import { createList, createTask, setCompleted } from "@/lib/tasks/service";
import { createTestDb } from "@/test/db";
import { getWeeklyStats, recordFocusSession } from "./stats";

const PARIS = "Europe/Paris";
const NOW = new Date("2026-10-16T16:00:00Z"); // Friday 18:00 in Paris
let db: Database;

async function doneOn(title: string, isoInstant: string, extra: Parameters<typeof createTask>[2] = { title }) {
  const task = await createTask(db, "sam", { ...extra, title, dueDate: isoInstant.slice(0, 10) });
  await setCompleted(db, "sam", task.id, true, new Date(isoInstant));
  return task;
}

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values({ id: "sam", name: "Sam", email: "sam@example.com" });
});

describe("getWeeklyStats", () => {
  it("counts per local day, streak, completion rate and Claude's share", async () => {
    const work = await createList(db, "sam", "Travail", "#FF9500");
    await doneOn("Mon", "2026-10-12T08:00:00Z");
    // Done at 23:30 Paris on Wednesday: still Wednesday locally.
    await doneOn("Wed late", "2026-10-14T21:30:00Z");
    await doneOn("Thu", "2026-10-15T08:00:00Z", { title: "Thu", listId: work.id });
    await doneOn("Fri a", "2026-10-16T08:00:00Z", { title: "Fri a", listId: work.id });
    const fromClaude = await doneOn("Fri b", "2026-10-16T09:00:00Z");
    await db.update(tasks).set({ source: "claude" }).where(eq(tasks.id, fromClaude.id));
    await createTask(db, "sam", { title: "Not done", dueDate: "2026-10-16" });
    await recordFocusSession(db, "sam", 25, null, NOW);

    const stats = await getWeeklyStats(db, "sam", PARIS, NOW);
    expect(stats.days.map((d) => [d.day, d.done])).toEqual([
      ["2026-10-10", 0],
      ["2026-10-11", 0],
      ["2026-10-12", 1],
      ["2026-10-13", 0],
      ["2026-10-14", 1],
      ["2026-10-15", 1],
      ["2026-10-16", 2],
    ]);
    expect(stats.done).toBe(5);
    expect(stats.streak).toBe(3);
    expect(stats.completionRate).toBeCloseTo(5 / 6);
    expect(stats.fromClaude).toBe(1);
    expect(stats.bestDay).toBe("2026-10-16");
    expect(stats.topLists).toEqual([{ name: "Travail", color: "#FF9500", done: 2 }]);
    expect(stats.focusMinutes).toBe(25);
  });

  it("keeps the streak alive until the end of today", async () => {
    await doneOn("Yesterday", "2026-10-15T08:00:00Z");
    expect((await getWeeklyStats(db, "sam", PARIS, NOW)).streak).toBe(1);
  });
});
