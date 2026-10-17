import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { tasks, user } from "@/db/schema";
import { createTestDb } from "@/test/db";
import { applyRefresh, getLatestRefresh, listClaudeTasks, undoRefresh } from "./refresh";
import { createTask, getTask, setCompleted, updateTask } from "./service";

let db: Database;
const T0 = new Date("2026-10-17T08:00:00Z");
const fromClaude = (title: string, extra: Partial<Parameters<typeof createTask>[2]> = {}) =>
  createTask(db, "sam", { title, dueDate: "2026-10-17", ...extra }, { source: "claude", sourceKind: "gmail", sourceUrl: `https://mail.example/${title}` });
const find = async (id: string) => (await db.select().from(tasks).where(eq(tasks.id, id)))[0];

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: "sam", name: "Sam", email: "sam@example.com" },
    { id: "kim", name: "Kim", email: "kim@example.com" },
  ]);
});

describe("applyRefresh", () => {
  it("updates, completes and removes Claude's tasks, with a reason for each", async () => {
    const quote = await fromClaude("Send the quote", { dueTime: "10:30", tags: ["client"] });
    const reply = await fromClaude("Reply to Sarah");
    const prep = await fromClaude("Prepare the demo");

    const result = await applyRefresh(
      db,
      "sam",
      [
        { id: quote.id, action: "update", reason: "Dupont asked for it by Monday", dueDate: "2026-10-19", dueTime: "09:00", title: "Send the quote" },
        { id: reply.id, action: "complete", reason: "You replied yesterday" },
        { id: prep.id, action: "remove", reason: "The demo was cancelled" },
      ],
      T0,
    );

    expect(result.applied.map((a) => a.action)).toEqual(["update", "complete", "remove"]);
    expect(await find(quote.id)).toMatchObject({ dueDate: "2026-10-19", dueTime: "09:00", userEditedAt: null });
    expect((await find(reply.id)).completedAt).toEqual(T0);
    expect(await find(prep.id)).toBeUndefined();

    const summary = await getLatestRefresh(db, "sam", new Date(0));
    expect(summary?.items.map((i) => [i.title, i.action, i.reason])).toEqual([
      ["Send the quote", "update", "Dupont asked for it by Monday"],
      ["Reply to Sarah", "complete", "You replied yesterday"],
      ["Prepare the demo", "remove", "The demo was cancelled"],
    ]);
    // Only what really changed is logged: the title was resent identical.
    expect(summary?.items[0].changes).toEqual({
      dueDate: { from: "2026-10-17", to: "2026-10-19" },
      dueTime: { from: "10:30", to: "09:00" },
    });
  });

  it("leaves alone what isn't Claude's to change", async () => {
    const manual = await createTask(db, "sam", { title: "Buy bread", dueDate: "2026-10-17" });
    const edited = await fromClaude("Call Paul");
    await updateTask(db, "sam", edited.id, { dueTime: "15:00" }); // the user's own edit
    const done = await fromClaude("Book the room");
    await setCompleted(db, "sam", done.id, true);
    const weekly = await fromClaude("Send the weekly report", { recurrence: "weekly" });
    const parent = await fromClaude("Plan the offsite");
    await createTask(db, "sam", { title: "Find a venue", parentId: parent.id });
    const same = await fromClaude("Read the brief");
    const kims = await createTask(db, "kim", { title: "Kim's task" }, { source: "claude" });

    const result = await applyRefresh(db, "sam", [
      { id: manual.id, action: "complete", reason: "x" },
      { id: edited.id, action: "update", reason: "x", dueTime: "16:00" },
      { id: done.id, action: "remove", reason: "x" },
      { id: weekly.id, action: "complete", reason: "x" },
      { id: parent.id, action: "remove", reason: "x" },
      { id: same.id, action: "update", reason: "x", title: "  Read the brief " },
      { id: kims.id, action: "remove", reason: "x" },
      { id: "nope", action: "remove", reason: "x" },
    ]);

    expect(result.applied).toEqual([]);
    expect(result.batchId).toBeNull();
    expect(result.skipped.map((s) => s.reason)).toEqual([
      "not_from_claude",
      "edited_by_user",
      "already_done",
      "recurring",
      "has_subtasks",
      "unchanged",
      "not_found",
      "not_found",
    ]);
    expect((await find(edited.id)).dueTime).toBe("15:00");
    expect(await find(parent.id)).toBeDefined();
    expect(await getLatestRefresh(db, "sam", new Date(0))).toBeNull();
  });

  it("lists only open, top-level tasks from Claude", async () => {
    const open = await fromClaude("Open one");
    await setCompleted(db, "sam", (await fromClaude("Done one")).id, true);
    await createTask(db, "sam", { title: "Manual" });
    await createTask(db, "sam", { title: "Sub", parentId: open.id });
    expect((await listClaudeTasks(db, "sam")).map((t) => t.title)).toEqual(["Open one"]);
  });
});

describe("undoRefresh", () => {
  it("puts every task back as it was, tags included", async () => {
    const quote = await fromClaude("Send the quote", { dueTime: "10:30" });
    const reply = await fromClaude("Reply to Sarah");
    const prep = await fromClaude("Prepare the demo", { tags: ["demo"], priority: 2 });
    const { batchId } = await applyRefresh(db, "sam", [
      { id: quote.id, action: "update", reason: "r", dueTime: "14:00", priority: 3 },
      { id: reply.id, action: "complete", reason: "r" },
      { id: prep.id, action: "remove", reason: "r" },
    ]);

    const restored = await undoRefresh(db, "sam", batchId!);
    expect(restored.sort()).toEqual([quote.id, reply.id, prep.id].sort());
    expect(await find(quote.id)).toMatchObject({ dueTime: "10:30", priority: 0 });
    expect((await find(reply.id)).completedAt).toBeNull();
    const back = await getTask(db, "sam", prep.id);
    expect(back).toMatchObject({ title: "Prepare the demo", priority: 2, source: "claude", sourceKind: "gmail" });
    expect(back.tagNames).toEqual(["demo"]);
    expect(await getLatestRefresh(db, "sam", new Date(0))).toBeNull();
  });

  it("keeps the user's version of a task they edited after the refresh", async () => {
    const quote = await fromClaude("Send the quote", { dueTime: "10:30" });
    const { batchId } = await applyRefresh(db, "sam", [{ id: quote.id, action: "update", reason: "r", dueTime: "14:00" }], T0);
    await updateTask(db, "sam", quote.id, { dueTime: "17:00" });
    expect(await undoRefresh(db, "sam", batchId!)).toEqual([]);
    expect((await find(quote.id)).dueTime).toBe("17:00");
  });

  it("only undoes the user's own refreshes", async () => {
    const quote = await fromClaude("Send the quote");
    const { batchId } = await applyRefresh(db, "sam", [{ id: quote.id, action: "complete", reason: "r" }]);
    expect(await undoRefresh(db, "kim", batchId!)).toEqual([]);
    expect((await find(quote.id)).completedAt).not.toBeNull();
  });
});
