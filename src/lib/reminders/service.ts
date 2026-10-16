import { and, eq, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import type { Database } from "@/db";
import { type Reminder, type ReminderKind, reminders, tasks } from "@/db/schema";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { en } from "@/i18n/dictionaries/en";
import { fr } from "@/i18n/dictionaries/fr";
import { format, plural } from "@/i18n/format";
import { type PreferencesValues, getPreferences } from "@/lib/preferences";
import type { PushPayload, SendResult } from "@/lib/push/send";
import { getTodayTasks } from "@/lib/tasks/service";
import { addDays, startOfDayUtc, todayIn } from "@/lib/time";
import { FOLLOW_UP_MINUTES, MAX_FOLLOW_UPS, afterQuietHours, followUpCount, nextDailyAt, taskReminderAt } from "./plan";

/**
 * Reminders: rows in `reminders` are the truth; a scheduler (QStash or the
 * local sweep) only wakes the server at the right time. Dependencies are
 * injected so the whole flow runs in tests without a push service.
 */
export type ReminderDeps = {
  db: Database;
  send: (userId: string, payload: PushPayload) => Promise<SendResult>;
  schedule: (reminder: Pick<Reminder, "id" | "dueAt">) => Promise<void>;
  now?: () => Date;
};

const nowOf = (deps: ReminderDeps) => deps.now?.() ?? new Date();
const dictionary = (prefs: PreferencesValues): Dictionary => (prefs.locale === "en" ? en : fr);

async function insertReminder(
  deps: ReminderDeps,
  values: { userId: string; taskId?: string | null; kind: ReminderKind; dueAt: Date; attempt?: number },
) {
  const [row] = await deps.db
    .insert(reminders)
    .values({ id: crypto.randomUUID(), taskId: null, attempt: 0, ...values })
    .returning();
  await deps.schedule(row);
  return row;
}

async function cancelPending(deps: ReminderDeps, where: ReturnType<typeof and> | ReturnType<typeof eq>) {
  await deps.db
    .update(reminders)
    .set({ cancelledAt: nowOf(deps) })
    .where(and(where, isNull(reminders.sentAt), isNull(reminders.cancelledAt)));
}

/**
 * Makes a task's pending reminders match the task: called after every change.
 * An open task with a day and a time gets one reminder; anything else gets none.
 */
export async function syncTaskReminders(deps: ReminderDeps, _userId: string, taskId: string): Promise<void> {
  // Callers have already checked access; the reminder goes to whoever should do the task.
  await cancelPending(deps, eq(reminders.taskId, taskId));
  const [task] = await deps.db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task || task.completedAt || task.parentId) return;
  const recipient = task.assigneeId ?? task.userId;
  const prefs = await getPreferences(deps.db, recipient);
  const at = taskReminderAt(task.dueDate, task.dueTime, prefs.timeZone);
  if (!at || at.getTime() < nowOf(deps).getTime() - 60_000) return;
  await insertReminder(deps, { userId: recipient, taskId, kind: "task", dueAt: at });
}

/** Re-plans every open timed task, e.g. after a time zone change. */
export async function syncAllTaskReminders(deps: ReminderDeps, userId: string): Promise<void> {
  const rows = await deps.db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        or(eq(tasks.assigneeId, userId), and(isNull(tasks.assigneeId), eq(tasks.userId, userId))),
        isNull(tasks.completedAt),
        isNotNull(tasks.dueTime),
      ),
    );
  for (const row of rows) await syncTaskReminders(deps, userId, row.id);
}

/** Plans the next morning briefing and evening review from the user's times. */
export async function syncDailyReminders(deps: ReminderDeps, userId: string): Promise<void> {
  await cancelPending(deps, and(eq(reminders.userId, userId), inArray(reminders.kind, ["briefing", "review"])));
  const prefs = await getPreferences(deps.db, userId);
  if (!prefs.onboardedAt) return;
  const now = nowOf(deps);
  await insertReminder(deps, { userId, kind: "briefing", dueAt: nextDailyAt(prefs.briefingTime, prefs.timeZone, now) });
  await insertReminder(deps, { userId, kind: "review", dueAt: nextDailyAt(prefs.reviewTime, prefs.timeZone, now) });
}

/** Snoozes a task: its pending reminders move to `at`. */
export async function snoozeTask(deps: ReminderDeps, userId: string, taskId: string, at: Date): Promise<void> {
  await cancelPending(deps, and(eq(reminders.userId, userId), eq(reminders.taskId, taskId)));
  await insertReminder(deps, { userId, taskId, kind: "task", dueAt: at });
}

async function todayCounts(db: Database, userId: string, prefs: PreferencesValues) {
  const today = todayIn(prefs.timeZone);
  const sections = await getTodayTasks(db, userId, today, startOfDayUtc(today, prefs.timeZone));
  const open = [...sections.overdue, ...sections.today];
  return { sections, open, total: open.length + sections.done.length };
}

export type FireOutcome = "sent" | "deferred" | "skipped" | "cancelled";

/** Sends one reminder if it's due, then plans what comes after it. */
export async function fireReminder(deps: ReminderDeps, reminderId: string): Promise<FireOutcome> {
  const { db } = deps;
  const now = nowOf(deps);
  const [reminder] = await db.select().from(reminders).where(eq(reminders.id, reminderId));
  if (!reminder || reminder.sentAt || reminder.cancelledAt) return "skipped";
  // A scheduler may wake us a little early; the sweep or another message will retry.
  if (reminder.dueAt.getTime() > now.getTime() + 30_000) return "skipped";

  const prefs = await getPreferences(db, reminder.userId);
  const t = dictionary(prefs);

  const task = reminder.taskId
    ? (await db.select().from(tasks).where(eq(tasks.id, reminder.taskId)))[0]
    : undefined;
  if (reminder.taskId && (!task || task.completedAt)) {
    await db.update(reminders).set({ cancelledAt: now }).where(eq(reminders.id, reminder.id));
    return "cancelled";
  }

  const allowed = afterQuietHours(now, prefs.timeZone, prefs.quietStart, prefs.quietEnd);
  if (allowed > now) {
    await db.update(reminders).set({ dueAt: allowed }).where(eq(reminders.id, reminder.id));
    await deps.schedule({ id: reminder.id, dueAt: allowed });
    return "deferred";
  }

  // Claim it, so two schedulers waking at once can't send it twice.
  const claimed = await db
    .update(reminders)
    .set({ sentAt: now })
    .where(and(eq(reminders.id, reminder.id), isNull(reminders.sentAt), isNull(reminders.cancelledAt)))
    .returning({ id: reminders.id });
  if (claimed.length === 0) return "skipped";

  const { sections, open, total } = await todayCounts(db, reminder.userId, prefs);
  const badge = open.length;
  let payload: PushPayload;

  if (task && (reminder.kind === "task" || reminder.kind === "follow-up")) {
    const max = followUpCount(prefs.insistence, task.priority, prefs.followUpPriorityOnly);
    const time = task.dueTime ?? "";
    payload = {
      title: reminder.attempt === 0 ? task.title : format(t.reminders.followUpTitle, { title: task.title }),
      body:
        reminder.attempt === 0
          ? time
            ? format(t.reminders.dueAt, { time })
            : ""
          : format(max >= MAX_FOLLOW_UPS ? t.reminders.followUpBodyOpen : t.reminders.followUpBody, { n: reminder.attempt, max, time }),
      url: `/tasks/${task.id}`,
      tag: `task-${task.id}`,
      badge,
      reminderId: reminder.id,
      actions: [
        { action: "done", title: t.reminders.actionDone },
        { action: "snooze", title: t.reminders.actionSnooze },
      ],
    };
    if (reminder.attempt < max) {
      await insertReminder(deps, {
        userId: reminder.userId,
        taskId: task.id,
        kind: "follow-up",
        attempt: reminder.attempt + 1,
        dueAt: new Date(now.getTime() + FOLLOW_UP_MINUTES * 60_000),
      });
    }
  } else if (reminder.kind === "briefing") {
    const first = sections.today.find((x) => x.dueTime);
    payload = {
      title: open.length ? plural(prefs.locale === "en" ? "en" : "fr", open.length, t.reminders.briefingTitle) : t.reminders.briefingEmpty,
      body: first
        ? format(t.reminders.briefingFirst, { time: first.dueTime!, title: first.title })
        : prefs.claudeSeenAt
          ? t.reminders.briefingClaude
          : t.reminders.briefingOpen,
      url: "/today",
      tag: "briefing",
      badge,
    };
    await insertReminder(deps, { userId: reminder.userId, kind: "briefing", dueAt: nextDailyAt(prefs.briefingTime, prefs.timeZone, now) });
  } else {
    const left = open.length;
    payload = {
      title: format(t.reminders.reviewTitle, { done: sections.done.length, total }),
      body: left ? plural(prefs.locale === "en" ? "en" : "fr", left, t.reminders.reviewBody) : t.reminders.reviewAllDone,
      url: "/review",
      tag: "review",
      badge,
    };
    await insertReminder(deps, { userId: reminder.userId, kind: "review", dueAt: nextDailyAt(prefs.reviewTime, prefs.timeZone, now) });
  }

  await deps.send(reminder.userId, payload);
  return "sent";
}

/** Sends every reminder that is due (the sweep, and the local scheduler). */
export async function fireDueReminders(deps: ReminderDeps, limit = 200): Promise<Record<FireOutcome, number>> {
  const due = await deps.db
    .select({ id: reminders.id })
    .from(reminders)
    .where(and(isNull(reminders.sentAt), isNull(reminders.cancelledAt), lte(reminders.dueAt, nowOf(deps))))
    .limit(limit);
  const counts: Record<FireOutcome, number> = { sent: 0, deferred: 0, skipped: 0, cancelled: 0 };
  for (const { id } of due) {
    try {
      counts[await fireReminder(deps, id)]++;
    } catch (error) {
      console.error(`Reminder ${id} failed`, error);
    }
  }
  return counts;
}

/** Moves a task to tomorrow (evening review, notification action). */
export async function moveTaskToTomorrow(deps: ReminderDeps, userId: string, taskId: string): Promise<void> {
  const prefs = await getPreferences(deps.db, userId);
  const tomorrow = addDays(todayIn(prefs.timeZone, nowOf(deps)), 1);
  await deps.db
    .update(tasks)
    .set({ dueDate: tomorrow, updatedAt: nowOf(deps) })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  await syncTaskReminders(deps, userId, taskId);
}
