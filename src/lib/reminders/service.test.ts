import { and, eq, isNull } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { reminders, user } from "@/db/schema";
import type { PushPayload } from "@/lib/push/send";
import { savePreferences } from "@/lib/preferences";
import { createTask, setCompleted } from "@/lib/tasks/service";
import { createTestDb } from "@/test/db";
import { type ReminderDeps, fireDueReminders, fireReminder, snoozeTask, syncDailyReminders, syncTaskReminders } from "./service";

// Friday 16 October 2026, 09:00 in Paris
let clock = new Date("2026-10-16T07:00:00Z");
let db: Database;
let sent: { userId: string; payload: PushPayload }[];
let deps: ReminderDeps;

const pending = () =>
  db.select().from(reminders).where(and(isNull(reminders.sentAt), isNull(reminders.cancelledAt)));

beforeEach(async () => {
  clock = new Date("2026-10-16T07:00:00Z");
  db = await createTestDb();
  sent = [];
  deps = {
    db,
    now: () => clock,
    send: async (userId, payload) => {
      sent.push({ userId, payload });
      return { sent: 1, removed: 0, failed: 0 };
    },
    schedule: async () => {},
  };
  await db.insert(user).values({ id: "sam", name: "Sam", email: "sam@example.com" });
  await savePreferences(db, "sam", { timeZone: "Europe/Paris", insistence: 2, followUpPriorityOnly: true, onboardedAt: clock });
});

describe("task reminders", () => {
  it("plans one reminder for a timed task and none for an untimed one", async () => {
    const timed = await createTask(db, "sam", { title: "Reply to Sarah", dueDate: "2026-10-16", dueTime: "10:30" });
    const untimed = await createTask(db, "sam", { title: "Groceries", dueDate: "2026-10-16" });
    await syncTaskReminders(deps, "sam", timed.id);
    await syncTaskReminders(deps, "sam", untimed.id);
    const rows = await pending();
    expect(rows).toHaveLength(1);
    expect(rows[0].dueAt.toISOString()).toBe("2026-10-16T08:30:00.000Z");
  });

  it("sends at the time, with a follow-up only for priority tasks", async () => {
    const normal = await createTask(db, "sam", { title: "Normal", dueDate: "2026-10-16", dueTime: "10:30" });
    const urgent = await createTask(db, "sam", { title: "Urgent", dueDate: "2026-10-16", dueTime: "10:30", priority: 3 });
    await syncTaskReminders(deps, "sam", normal.id);
    await syncTaskReminders(deps, "sam", urgent.id);

    clock = new Date("2026-10-16T08:30:00Z");
    expect(await fireDueReminders(deps)).toMatchObject({ sent: 2 });
    expect(sent.map((s) => s.payload.title).sort()).toEqual(["Normal", "Urgent"]);
    expect(sent[0].payload.body).toBe("Prévu à 10:30");

    const followUps = await pending();
    expect(followUps).toHaveLength(1);
    expect(followUps[0]).toMatchObject({ taskId: urgent.id, kind: "follow-up", attempt: 1 });

    clock = new Date("2026-10-16T08:45:00Z");
    await fireDueReminders(deps);
    expect(sent.at(-1)?.payload.title).toBe("Toujours pas fait : Urgent");
    // Insistence 2 means one follow-up only.
    expect(await pending()).toHaveLength(0);
  });

  it("cancels reminders of a task checked in the meantime", async () => {
    const task = await createTask(db, "sam", { title: "Call", dueDate: "2026-10-16", dueTime: "10:30" });
    await syncTaskReminders(deps, "sam", task.id);
    await setCompleted(db, "sam", task.id, true);
    clock = new Date("2026-10-16T08:30:00Z");
    expect(await fireDueReminders(deps)).toMatchObject({ sent: 0, cancelled: 1 });
  });

  it("holds reminders during quiet hours", async () => {
    const task = await createTask(db, "sam", { title: "Late", dueDate: "2026-10-16", dueTime: "23:00" });
    await syncTaskReminders(deps, "sam", task.id);
    clock = new Date("2026-10-16T21:00:00Z");
    expect(await fireDueReminders(deps)).toMatchObject({ deferred: 1 });
    const [row] = await pending();
    expect(row.dueAt.toISOString()).toBe("2026-10-17T05:00:00.000Z");
  });

  it("never sends the same reminder twice", async () => {
    const task = await createTask(db, "sam", { title: "Once", dueDate: "2026-10-16", dueTime: "10:30" });
    await syncTaskReminders(deps, "sam", task.id);
    const [row] = await pending();
    clock = new Date("2026-10-16T08:30:00Z");
    expect(await fireReminder(deps, row.id)).toBe("sent");
    expect(await fireReminder(deps, row.id)).toBe("skipped");
    expect(sent).toHaveLength(1);
  });

  it("snoozes to a new time", async () => {
    const task = await createTask(db, "sam", { title: "Snooze me", dueDate: "2026-10-16", dueTime: "09:00" });
    await snoozeTask(deps, "sam", task.id, new Date("2026-10-16T07:15:00Z"));
    const rows = await pending();
    expect(rows).toHaveLength(1);
    expect(rows[0].dueAt.toISOString()).toBe("2026-10-16T07:15:00.000Z");
  });
});

describe("briefing and review", () => {
  it("plans both daily and replans after sending", async () => {
    await syncDailyReminders(deps, "sam");
    const rows = await pending();
    expect(rows.map((r) => [r.kind, r.dueAt.toISOString()]).sort()).toEqual([
      ["briefing", "2026-10-17T05:30:00.000Z"],
      ["review", "2026-10-16T16:30:00.000Z"],
    ]);

    await createTask(db, "sam", { title: "Left over", dueDate: "2026-10-16" });
    clock = new Date("2026-10-16T16:30:00Z");
    await fireDueReminders(deps);
    expect(sent.at(-1)?.payload).toMatchObject({ title: "Bilan du soir : 0 sur 1 faites", url: "/review", badge: 1 });
    const next = (await db.select().from(reminders).where(eq(reminders.kind, "review"))).find((r) => !r.sentAt && !r.cancelledAt);
    expect(next?.dueAt.toISOString()).toBe("2026-10-17T16:30:00.000Z");
  });
});
