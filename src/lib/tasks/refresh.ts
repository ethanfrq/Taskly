import { and, asc, count, desc, eq, gte, isNull } from "drizzle-orm";
import type { Database } from "@/db";
import { type FieldChanges, type TaskSnapshot, type Task, claudeChanges, lists, tags, taskTags, tasks } from "@/db/schema";
import { setCompleted, setTags, updateTask } from "./service";

/*
 * Claude's refresh: when the user asks Claude to refresh their day, Claude
 * re-reads the sources of the tasks it created and reports what changed.
 * Guardrails (ADR 0008): only tasks Claude created, never one the user edited
 * since, every change carries a reason the user sees, and a batch can be undone.
 */

export type RefreshAction = "update" | "complete" | "remove";

export type RefreshChange = {
  id: string;
  action: RefreshAction;
  /** Shown to the user: "Sarah replied", "Meeting moved to 3 pm". */
  reason: string;
  title?: string;
  notes?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: number;
};

export type SkipReason =
  | "not_found"
  | "not_from_claude"
  | "edited_by_user"
  | "already_done"
  | "recurring"
  | "has_subtasks"
  | "unchanged";

export type RefreshResult = {
  batchId: string | null;
  applied: { id: string; action: RefreshAction }[];
  skipped: { id: string; reason: SkipReason }[];
};

const FIELDS = ["title", "notes", "dueDate", "dueTime", "priority"] as const;

/** Open tasks Claude created for this user, any date: what a refresh re-checks. */
export async function listClaudeTasks(db: Database, userId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.source, "claude"), isNull(tasks.completedAt), isNull(tasks.parentId)))
    .orderBy(asc(tasks.dueDate), asc(tasks.dueTime), asc(tasks.createdAt));
}

async function tagNames(db: Database, taskId: string): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(taskTags)
    .innerJoin(tags, eq(tags.id, taskTags.tagId))
    .where(eq(taskTags.taskId, taskId));
  return rows.map((r) => r.name);
}

function snapshot(task: Task, names: string[]): TaskSnapshot {
  return {
    id: task.id,
    listId: task.listId,
    assigneeId: task.assigneeId,
    title: task.title,
    notes: task.notes,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    priority: task.priority,
    position: task.position,
    sourceKind: task.sourceKind,
    sourceUrl: task.sourceUrl,
    sourceLabel: task.sourceLabel,
    importBatchId: task.importBatchId,
    createdAt: task.createdAt.toISOString(),
    tagNames: names,
  };
}

/** The fields that would really change; an empty object means nothing to do. */
function diff(task: Task, change: RefreshChange): FieldChanges {
  const wanted: Partial<Record<(typeof FIELDS)[number], unknown>> = {
    title: change.title?.trim(),
    notes: change.notes,
    dueDate: change.dueDate,
    // A task without a date has no time.
    dueTime: change.dueDate === null ? null : change.dueTime,
    priority: change.priority,
  };
  const changes: FieldChanges = {};
  for (const field of FIELDS) {
    const to = wanted[field];
    if (to === undefined || to === task[field]) continue;
    changes[field] = { from: task[field], to };
  }
  return changes;
}

/** Applies what Claude found in the sources, one task at a time, and logs each change. */
export async function applyRefresh(db: Database, userId: string, changes: RefreshChange[], now = new Date()): Promise<RefreshResult> {
  const batchId = crypto.randomUUID();
  const result: RefreshResult = { batchId: null, applied: [], skipped: [] };
  const skip = (id: string, reason: SkipReason) => void result.skipped.push({ id, reason });

  for (const change of changes) {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, change.id), eq(tasks.userId, userId)));
    if (!task) {
      skip(change.id, "not_found");
      continue;
    }
    if (task.source !== "claude") skip(task.id, "not_from_claude");
    else if (task.completedAt) skip(task.id, "already_done");
    else if (task.userEditedAt) skip(task.id, "edited_by_user");
    else if (change.action !== "update" && task.recurrence) skip(task.id, "recurring");
    else {
      const before = snapshot(task, await tagNames(db, task.id));
      let fieldChanges: FieldChanges | null = null;

      if (change.action === "update") {
        fieldChanges = diff(task, change);
        if (Object.keys(fieldChanges).length === 0) {
          skip(task.id, "unchanged");
          continue;
        }
        const patch = Object.fromEntries(Object.entries(fieldChanges).map(([field, c]) => [field, c.to]));
        await updateTask(db, userId, task.id, patch, "claude");
      } else if (change.action === "complete") {
        await setCompleted(db, userId, task.id, true, now);
      } else {
        const [{ subtasks }] = await db.select({ subtasks: count() }).from(tasks).where(eq(tasks.parentId, task.id));
        if (subtasks > 0) {
          skip(task.id, "has_subtasks");
          continue;
        }
        await db.delete(tasks).where(eq(tasks.id, task.id));
      }

      await db.insert(claudeChanges).values({
        id: crypto.randomUUID(),
        userId,
        batchId,
        position: result.applied.length,
        taskId: task.id,
        action: change.action,
        title: task.title,
        reason: change.reason.trim(),
        before,
        changes: fieldChanges,
        createdAt: now,
      });
      result.applied.push({ id: task.id, action: change.action });
    }
  }
  if (result.applied.length) result.batchId = batchId;
  return result;
}

export type RefreshSummary = {
  batchId: string;
  items: { taskId: string; action: RefreshAction; title: string; reason: string; changes: FieldChanges | null }[];
};

/** The latest refresh since `since` that wasn't undone, for the Today banner. */
export async function getLatestRefresh(db: Database, userId: string, since: Date): Promise<RefreshSummary | null> {
  const [latest] = await db
    .select({ batchId: claudeChanges.batchId })
    .from(claudeChanges)
    .where(and(eq(claudeChanges.userId, userId), gte(claudeChanges.createdAt, since), isNull(claudeChanges.undoneAt)))
    .orderBy(desc(claudeChanges.createdAt))
    .limit(1);
  if (!latest) return null;
  const rows = await db
    .select()
    .from(claudeChanges)
    .where(and(eq(claudeChanges.userId, userId), eq(claudeChanges.batchId, latest.batchId), isNull(claudeChanges.undoneAt)))
    .orderBy(asc(claudeChanges.position));
  return {
    batchId: latest.batchId,
    items: rows.map((r) => ({ taskId: r.taskId, action: r.action, title: r.title, reason: r.reason, changes: r.changes })),
  };
}

/**
 * Puts the tasks of a refresh back as they were. A task the user edited after
 * the refresh keeps the user's version. Returns the ids of the restored tasks,
 * so their reminders can be planned again.
 */
export async function undoRefresh(db: Database, userId: string, batchId: string, now = new Date()): Promise<string[]> {
  const rows = await db
    .select()
    .from(claudeChanges)
    .where(and(eq(claudeChanges.userId, userId), eq(claudeChanges.batchId, batchId), isNull(claudeChanges.undoneAt)))
    .orderBy(desc(claudeChanges.position));
  const restored: string[] = [];

  for (const row of rows) {
    const { before } = row;
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, row.taskId), eq(tasks.userId, userId)));
    const editedSince = !!task?.userEditedAt && task.userEditedAt > row.createdAt;

    if (row.action === "remove" && !task) {
      // The list or the assignee may be gone since: the task comes back without them.
      const [list] = before.listId ? await db.select({ id: lists.id }).from(lists).where(eq(lists.id, before.listId)) : [];
      await db.insert(tasks).values({
        id: before.id,
        userId,
        listId: list ? before.listId : null,
        assigneeId: list ? before.assigneeId : null,
        title: before.title,
        notes: before.notes,
        dueDate: before.dueDate,
        dueTime: before.dueTime,
        priority: before.priority,
        position: before.position,
        source: "claude",
        sourceKind: before.sourceKind as Task["sourceKind"],
        sourceUrl: before.sourceUrl,
        sourceLabel: before.sourceLabel,
        importBatchId: before.importBatchId,
        createdAt: new Date(before.createdAt),
        updatedAt: now,
      });
      if (before.tagNames.length) await setTags(db, userId, before.id, before.tagNames);
      restored.push(before.id);
    } else if (row.action === "complete" && task?.completedAt && !editedSince) {
      await db.update(tasks).set({ completedAt: null, updatedAt: now }).where(eq(tasks.id, task.id));
      restored.push(task.id);
    } else if (row.action === "update" && task && !editedSince) {
      const fields = Object.keys(row.changes ?? {}) as (keyof FieldChanges)[];
      await db
        .update(tasks)
        .set({ ...Object.fromEntries(fields.map((f) => [f, before[f]])), updatedAt: now })
        .where(eq(tasks.id, task.id));
      restored.push(task.id);
    }
  }
  await db
    .update(claudeChanges)
    .set({ undoneAt: now })
    .where(and(eq(claudeChanges.userId, userId), eq(claudeChanges.batchId, batchId), isNull(claudeChanges.undoneAt)));
  return restored;
}
