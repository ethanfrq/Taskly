import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { reminders, user } from "@/db/schema";
import { savePreferences } from "@/lib/preferences";
import { syncTaskReminders } from "@/lib/reminders/service";
import { createTestDb } from "@/test/db";
import {
  NotFoundError,
  createList,
  createTask,
  deleteList,
  getInvite,
  getListTasks,
  getLists,
  getParticipants,
  getTodayTasks,
  joinList,
  leaveList,
  setCompleted,
  shareList,
  updateTask,
} from "./service";

const TODAY = "2026-10-16";
const START = new Date("2026-10-15T22:00:00Z");
let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: "sam", name: "Sam", email: "sam@example.com" },
    { id: "kim", name: "Kim", email: "kim@example.com" },
    { id: "eve", name: "Eve", email: "eve@example.com" },
  ]);
});

async function sharedList() {
  const list = await createList(db, "sam", "Maison");
  const token = await shareList(db, "sam", list.id);
  await joinList(db, "kim", token);
  return { list, token };
}

describe("shared lists", () => {
  it("lets a member see and complete the list's tasks, not an outsider", async () => {
    const { list } = await sharedList();
    const task = await createTask(db, "sam", { title: "Buy bread", listId: list.id });

    expect((await getListTasks(db, "kim", list.id)).map((t) => t.title)).toEqual(["Buy bread"]);
    await setCompleted(db, "kim", task.id, true);

    await expect(getListTasks(db, "eve", list.id)).rejects.toThrow(NotFoundError);
    await expect(updateTask(db, "eve", task.id, { title: "x" })).rejects.toThrow(NotFoundError);
  });

  it("shows assigned tasks on the assignee's day, not the creator's", async () => {
    const { list } = await sharedList();
    await createTask(db, "sam", { title: "Kim's chore", listId: list.id, dueDate: TODAY, assigneeId: "kim" });
    await createTask(db, "sam", { title: "Sam's chore", listId: list.id, dueDate: TODAY });

    expect((await getTodayTasks(db, "kim", TODAY, START)).today.map((t) => t.title)).toEqual(["Kim's chore"]);
    expect((await getTodayTasks(db, "sam", TODAY, START)).today.map((t) => t.title)).toEqual(["Sam's chore"]);
  });

  it("only assigns to people in the list", async () => {
    const { list } = await sharedList();
    await expect(createTask(db, "sam", { title: "x", listId: list.id, assigneeId: "eve" })).rejects.toThrow(NotFoundError);
    const own = await createList(db, "sam", "Private");
    await expect(createTask(db, "sam", { title: "x", listId: own.id, assigneeId: "kim" })).rejects.toThrow(NotFoundError);
  });

  it("lists members and marks shared lists", async () => {
    const { list } = await sharedList();
    expect((await getParticipants(db, "kim", list.id)).map((p) => [p.email, p.isOwner])).toEqual([
      ["sam@example.com", true],
      ["kim@example.com", false],
    ]);
    const [kimView] = await getLists(db, "kim");
    expect(kimView).toMatchObject({ name: "Maison", isOwner: false, memberCount: 1 });
  });

  it("invalidates the old link when a new one is made, and only the owner can delete", async () => {
    const { list, token } = await sharedList();
    await shareList(db, "sam", list.id);
    expect(await getInvite(db, token)).toBeNull();
    await expect(deleteList(db, "kim", list.id)).rejects.toThrow(NotFoundError);
  });

  it("unassigns a member who leaves", async () => {
    const { list } = await sharedList();
    const task = await createTask(db, "sam", { title: "Laundry", listId: list.id, dueDate: TODAY, assigneeId: "kim" });
    await leaveList(db, "kim", list.id);
    await expect(getListTasks(db, "kim", list.id)).rejects.toThrow(NotFoundError);
    const [row] = await getListTasks(db, "sam", list.id);
    expect(row.id).toBe(task.id);
    expect(row.assigneeId).toBeNull();
  });

  it("sends reminders to the assignee", async () => {
    const { list } = await sharedList();
    await savePreferences(db, "kim", { timeZone: "Europe/Paris" });
    const task = await createTask(db, "sam", { title: "Call plumber", listId: list.id, dueDate: "2099-01-01", dueTime: "10:00", assigneeId: "kim" });
    await syncTaskReminders({ db, send: async () => ({ sent: 0, removed: 0, failed: 0 }), schedule: async () => {} }, "sam", task.id);
    const rows = await db.select().from(reminders);
    expect(rows.map((r) => r.userId)).toEqual(["kim"]);
  });
});
