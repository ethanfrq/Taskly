import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db";
import { tasks } from "@/db/schema";
import { getEventsBetween, pruneEvents, removeEvents, upsertEvents } from "@/lib/events/service";
import { getPreferences, savePreferences } from "@/lib/preferences";
import type { Recurrence } from "@/lib/tasks/recurrence";
import {
  createTask,
  findListByName,
  getLists,
  getTodayTasks,
  getUpcomingTasks,
  setCompleted,
  updateTask,
  type TaskView,
} from "@/lib/tasks/service";
import type { SourceKind } from "@/lib/tasks/sources";
import { addDays, startOfDayUtc, timeIn, todayIn } from "@/lib/time";

/*
 * What the MCP tools do, as plain functions over the database: testable
 * without an MCP client. src/lib/mcp/server.ts wires them to tools.
 */

export type McpContext = {
  db: Database;
  userId: string;
  /** Called after any change to a task, to keep its reminders in sync. */
  onTaskChanged: (taskId: string) => Promise<void>;
  now?: () => Date;
};

const now = (ctx: McpContext) => ctx.now?.() ?? new Date();

/** Remembers that Claude used Taskly (health check, D-009). */
export async function touchClaude(ctx: McpContext) {
  await savePreferences(ctx.db, ctx.userId, { claudeSeenAt: now(ctx) });
}

const taskOut = (t: TaskView) => ({
  id: t.id,
  title: t.title,
  due_date: t.dueDate,
  due_time: t.dueTime,
  priority: t.priority,
  done: !!t.completedAt,
  list: t.list?.name ?? null,
  tags: t.tagNames,
  source: t.sourceKind ? { kind: t.sourceKind, url: t.sourceUrl, label: t.sourceLabel } : null,
  added_by_claude: t.source === "claude",
});

export async function getToday(ctx: McpContext) {
  const prefs = await getPreferences(ctx.db, ctx.userId);
  const today = todayIn(prefs.timeZone, now(ctx));
  const start = startOfDayUtc(today, prefs.timeZone);
  const end = startOfDayUtc(addDays(today, 1), prefs.timeZone);
  const [sections, todayEvents] = await Promise.all([
    getTodayTasks(ctx.db, ctx.userId, today, start),
    getEventsBetween(ctx.db, ctx.userId, start, end),
  ]);
  return {
    today,
    now: timeIn(prefs.timeZone, now(ctx)),
    time_zone: prefs.timeZone,
    overdue: sections.overdue.map(taskOut),
    to_do: sections.today.map(taskOut),
    done: sections.done.map(taskOut),
    events: todayEvents.map((e) => ({
      id: e.externalId ?? e.id,
      title: e.title,
      start: timeIn(prefs.timeZone, e.startsAt),
      end: e.endsAt ? timeIn(prefs.timeZone, e.endsAt) : null,
      all_day: e.allDay,
      location: e.location,
    })),
  };
}

export async function getUpcoming(ctx: McpContext, days: number) {
  const prefs = await getPreferences(ctx.db, ctx.userId);
  const today = todayIn(prefs.timeZone, now(ctx));
  const rows = await getUpcomingTasks(ctx.db, ctx.userId, today, addDays(today, days));
  return { from: addDays(today, 1), to: addDays(today, days), tasks: rows.map(taskOut) };
}

export type NewTask = {
  title: string;
  notes?: string;
  due_date?: string;
  due_time?: string;
  priority?: number;
  list?: string;
  tags?: string[];
  recurrence?: Recurrence;
  source?: { kind: SourceKind; url?: string; label?: string };
};

const normalize = (title: string) => title.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Adds tasks as one import batch (the Today banner can undo it, D-008).
 * Skips tasks that already exist and are still open: same source link, or
 * same title on the same day. Claude can safely run "prepare my day" twice.
 */
export async function addTasks(ctx: McpContext, input: NewTask[]) {
  const prefs = await getPreferences(ctx.db, ctx.userId);
  const today = todayIn(prefs.timeZone, now(ctx));
  const open = await ctx.db
    .select({ title: tasks.title, dueDate: tasks.dueDate, sourceUrl: tasks.sourceUrl })
    .from(tasks)
    .where(and(eq(tasks.userId, ctx.userId), isNull(tasks.completedAt)));
  const batchId = crypto.randomUUID();
  const created: { id: string; title: string }[] = [];
  const skipped: { title: string; reason: string }[] = [];

  for (const item of input) {
    const dueDate = item.due_date ?? today;
    const duplicate = open.find(
      (t) =>
        (item.source?.url && t.sourceUrl === item.source.url) ||
        (normalize(t.title) === normalize(item.title) && t.dueDate === dueDate),
    );
    if (duplicate) {
      skipped.push({ title: item.title, reason: "already in Taskly" });
      continue;
    }
    const list = item.list ? await findListByName(ctx.db, ctx.userId, item.list) : null;
    const task = await createTask(
      ctx.db,
      ctx.userId,
      {
        title: item.title,
        notes: item.notes ?? null,
        dueDate,
        dueTime: item.due_time ?? null,
        priority: item.priority ?? 0,
        listId: list?.id ?? null,
        tags: item.tags,
        recurrence: item.recurrence ?? null,
      },
      {
        source: "claude",
        sourceKind: item.source?.kind ?? "other",
        sourceUrl: item.source?.url ?? null,
        sourceLabel: item.source?.label ?? null,
        importBatchId: batchId,
      },
    );
    open.push({ title: task.title, dueDate: task.dueDate, sourceUrl: task.sourceUrl });
    await ctx.onTaskChanged(task.id);
    created.push({ id: task.id, title: task.title });
  }
  return { created, skipped };
}

export async function completeTask(ctx: McpContext, taskId: string) {
  const prefs = await getPreferences(ctx.db, ctx.userId);
  const { task, next } = await setCompleted(ctx.db, ctx.userId, taskId, true, now(ctx), todayIn(prefs.timeZone, now(ctx)));
  await ctx.onTaskChanged(task.id);
  if (next) await ctx.onTaskChanged(next.id);
  return { id: task.id, title: task.title, done: true, next_occurrence: next?.dueDate ?? null };
}

export async function editTask(
  ctx: McpContext,
  taskId: string,
  patch: { title?: string; notes?: string; due_date?: string | null; due_time?: string | null; priority?: number },
) {
  const task = await updateTask(ctx.db, ctx.userId, taskId, {
    title: patch.title,
    notes: patch.notes,
    dueDate: patch.due_date,
    dueTime: patch.due_time,
    priority: patch.priority,
  });
  await ctx.onTaskChanged(task.id);
  return { id: task.id, title: task.title, due_date: task.dueDate, due_time: task.dueTime, priority: task.priority };
}

export async function listLists(ctx: McpContext) {
  const lists = await getLists(ctx.db, ctx.userId);
  return { lists: lists.map((l) => ({ name: l.name, open_tasks: l.openCount })) };
}

export type NewEvent = {
  title: string;
  start: string;
  end?: string;
  all_day?: boolean;
  location?: string;
  url?: string;
  id?: string;
  kind?: SourceKind;
};

/**
 * Saves events from the user's calendars. With `replaceDay`, the list is the
 * whole day: events Taskly had for that day and Claude didn't resend are
 * removed, so a cancelled meeting doesn't linger in the agenda.
 */
export async function addEvents(ctx: McpContext, input: NewEvent[], replaceDay?: string) {
  const ids = await upsertEvents(
    ctx.db,
    ctx.userId,
    input.map((e) => ({
      title: e.title,
      startsAt: new Date(e.start),
      endsAt: e.end ? new Date(e.end) : null,
      allDay: e.all_day ?? false,
      location: e.location ?? null,
      sourceUrl: e.url ?? null,
      externalId: e.id ?? null,
      sourceKind: e.kind ?? "calendar",
    })),
  );
  let removed = 0;
  if (replaceDay) {
    const { timeZone } = await getPreferences(ctx.db, ctx.userId);
    removed = await pruneEvents(
      ctx.db,
      ctx.userId,
      startOfDayUtc(replaceDay, timeZone),
      startOfDayUtc(addDays(replaceDay, 1), timeZone),
      ids,
    );
  }
  return { saved: ids.length, removed };
}

/** Removes events the user says were cancelled, by the ids get_today returns. */
export async function removeCalendarEvents(ctx: McpContext, ids: string[]) {
  return { removed: await removeEvents(ctx.db, ctx.userId, ids) };
}

/** "Taskly, check my connections": Claude lists the connectors it can use. */
export async function reportConnections(ctx: McpContext, sources: SourceKind[]) {
  const unique = [...new Set(sources)];
  await savePreferences(ctx.db, ctx.userId, { claudeSources: unique.join(","), claudeSeenAt: now(ctx) });
  return { recorded: unique, message: "Shown in Taskly's health check." };
}
