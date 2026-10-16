import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { user } from "@/db/schema";
import { createTestDb } from "@/test/db";
import {
  NotFoundError,
  countInbox,
  createList,
  createTask,
  deleteList,
  getLatestImport,
  getListTasks,
  getLists,
  getTask,
  getTodayTasks,
  reorderTasks,
  setCompleted,
  undoImport,
  updateTask,
} from "./service";

const TODAY = "2026-10-16";
const START = new Date("2026-10-15T22:00:00Z");

let db: Database;

async function addUser(id: string) {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
}

beforeEach(async () => {
  db = await createTestDb();
  await addUser("sam");
  await addUser("kim");
});

describe("Today", () => {
  it("splits overdue, today (by time) and done", async () => {
    await createTask(db, "sam", { title: "Late", dueDate: "2026-10-14" });
    await createTask(db, "sam", { title: "Afternoon", dueDate: TODAY, dueTime: "16:30" });
    await createTask(db, "sam", { title: "Morning", dueDate: TODAY, dueTime: "09:00" });
    await createTask(db, "sam", { title: "Untimed", dueDate: TODAY });
    await createTask(db, "sam", { title: "Tomorrow", dueDate: "2026-10-17" });
    await createTask(db, "sam", { title: "Someday" });
    const done = await createTask(db, "sam", { title: "Done", dueDate: TODAY });
    await setCompleted(db, "sam", done.id, true, new Date("2026-10-16T08:00:00Z"));

    const result = await getTodayTasks(db, "sam", TODAY, START);
    expect(result.overdue.map((t) => t.title)).toEqual(["Late"]);
    expect(result.today.map((t) => t.title)).toEqual(["Morning", "Afternoon", "Untimed"]);
    expect(result.done.map((t) => t.title)).toEqual(["Done"]);
  });

  it("never shows another user's tasks", async () => {
    await createTask(db, "kim", { title: "Kim's", dueDate: TODAY });
    const result = await getTodayTasks(db, "sam", TODAY, START);
    expect(result.today).toHaveLength(0);
  });

  it("counts subtasks and keeps them out of Today", async () => {
    const parent = await createTask(db, "sam", { title: "Demo slides", dueDate: TODAY });
    const a = await createTask(db, "sam", { title: "Outline", parentId: parent.id });
    await createTask(db, "sam", { title: "Screenshots", parentId: parent.id });
    await setCompleted(db, "sam", a.id, true);

    const { today } = await getTodayTasks(db, "sam", TODAY, START);
    expect(today).toHaveLength(1);
    expect(today[0].subtasks).toEqual({ done: 1, total: 2 });
    expect((await getTask(db, "sam", parent.id)).subtaskList.map((t) => t.title)).toEqual(["Outline", "Screenshots"]);
  });
});

describe("ownership", () => {
  it("refuses to touch another user's task or list", async () => {
    const task = await createTask(db, "kim", { title: "Private" });
    const list = await createList(db, "kim", "Work");
    await expect(updateTask(db, "sam", task.id, { title: "Hacked" })).rejects.toThrow(NotFoundError);
    await expect(setCompleted(db, "sam", task.id, true)).rejects.toThrow(NotFoundError);
    await expect(createTask(db, "sam", { title: "x", listId: list.id })).rejects.toThrow(NotFoundError);
    await expect(createTask(db, "sam", { title: "x", parentId: task.id })).rejects.toThrow(NotFoundError);
  });
});

describe("updates", () => {
  it("drops the time when the date is removed, and normalizes tags", async () => {
    const task = await createTask(db, "sam", { title: "Call", dueDate: TODAY, dueTime: "14:00", tags: ["#Work", "work", "calls"] });
    const updated = await updateTask(db, "sam", task.id, { dueDate: null });
    expect(updated.dueTime).toBeNull();
    expect((await getTask(db, "sam", task.id)).tagNames.sort()).toEqual(["calls", "work"]);
  });

  it("reorders within the same set of positions", async () => {
    const a = await createTask(db, "sam", { title: "A", dueDate: TODAY });
    const b = await createTask(db, "sam", { title: "B", dueDate: TODAY });
    const c = await createTask(db, "sam", { title: "C", dueDate: TODAY });
    await reorderTasks(db, "sam", [c.id, a.id, b.id]);
    const { today } = await getTodayTasks(db, "sam", TODAY, START);
    expect(today.map((t) => t.title)).toEqual(["C", "A", "B"]);
  });
});

describe("lists", () => {
  it("counts open tasks and moves tasks to the inbox when a list is deleted", async () => {
    const work = await createList(db, "sam", "Work", "#FF9500");
    await createTask(db, "sam", { title: "One", listId: work.id });
    const two = await createTask(db, "sam", { title: "Two", listId: work.id });
    await setCompleted(db, "sam", two.id, true);

    expect((await getLists(db, "sam"))[0].openCount).toBe(1);
    expect((await getListTasks(db, "sam", work.id)).map((t) => t.title)).toEqual(["One"]);

    await deleteList(db, "sam", work.id);
    expect(await countInbox(db, "sam")).toBe(1);
  });
});

describe("Claude imports", () => {
  it("summarizes and undoes the latest batch", async () => {
    const since = new Date(Date.now() - 60_000);
    await createTask(db, "sam", { title: "Reply to Sarah", dueDate: TODAY }, { source: "claude", sourceKind: "gmail", importBatchId: "b1" });
    await createTask(db, "sam", { title: "Review PR", dueDate: TODAY }, { source: "claude", sourceKind: "slack", importBatchId: "b1" });
    await createTask(db, "sam", { title: "Mine", dueDate: TODAY });

    const summary = await getLatestImport(db, "sam", since);
    expect(summary).toMatchObject({ batchId: "b1", count: 2 });
    expect(summary?.kinds.sort()).toEqual(["gmail", "slack"]);

    expect(await undoImport(db, "sam", "b1")).toBe(2);
    expect(await undoImport(db, "kim", "b1")).toBe(0);
    const { today } = await getTodayTasks(db, "sam", TODAY, START);
    expect(today.map((t) => t.title)).toEqual(["Mine"]);
  });
});
