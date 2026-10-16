import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, max, or, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { type List, type SourceKind, type Task, lists, tags, taskTags, tasks } from "@/db/schema";

/*
 * Task and list data access. Every function takes the user id and only
 * touches that user's rows: callers pass the id from the session, never
 * from the client.
 */

export type TaskSource = {
  source?: "manual" | "claude";
  sourceKind?: SourceKind | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  importBatchId?: string | null;
};

export type TaskInput = {
  title: string;
  notes?: string | null;
  listId?: string | null;
  parentId?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: number;
  recurrence?: string | null;
  tags?: string[];
};

export type TaskPatch = Partial<Omit<TaskInput, "parentId">>;

export type TaskView = Task & {
  list: Pick<List, "id" | "name" | "color"> | null;
  subtasks: { done: number; total: number };
  tagNames: string[];
};

const newId = () => crypto.randomUUID();

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
  }
}

async function assertList(db: Database, userId: string, listId: string | null | undefined) {
  if (!listId) return;
  const [row] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.ownerId, userId)));
  if (!row) throw new NotFoundError("List");
}

async function ownedTask(db: Database, userId: string, id: string): Promise<Task> {
  const [row] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  if (!row) throw new NotFoundError("Task");
  return row;
}

async function setTags(db: Database, userId: string, taskId: string, names: string[]) {
  const clean = [...new Set(names.map((n) => n.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))];
  await db.delete(taskTags).where(eq(taskTags.taskId, taskId));
  if (clean.length === 0) return;
  await db
    .insert(tags)
    .values(clean.map((name) => ({ id: newId(), userId, name })))
    .onConflictDoNothing();
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.name, clean)));
  await db.insert(taskTags).values(rows.map((t) => ({ taskId, tagId: t.id })));
}

export async function createTask(
  db: Database,
  userId: string,
  input: TaskInput,
  source: TaskSource = {},
): Promise<Task> {
  await assertList(db, userId, input.listId);
  let listId = input.listId ?? null;
  let dueDate = input.dueDate ?? null;
  if (input.parentId) {
    const parent = await ownedTask(db, userId, input.parentId);
    listId = parent.listId;
    dueDate = null;
  }
  const [{ last }] = await db
    .select({ last: max(tasks.position) })
    .from(tasks)
    .where(eq(tasks.userId, userId));
  const [task] = await db
    .insert(tasks)
    .values({
      id: newId(),
      userId,
      title: input.title.trim(),
      notes: input.notes ?? null,
      listId,
      parentId: input.parentId ?? null,
      dueDate,
      dueTime: dueDate ? (input.dueTime ?? null) : null,
      priority: input.priority ?? 0,
      recurrence: input.recurrence ?? null,
      position: (last ?? 0) + 1,
      source: source.source ?? "manual",
      sourceKind: source.sourceKind ?? null,
      sourceUrl: source.sourceUrl ?? null,
      sourceLabel: source.sourceLabel ?? null,
      importBatchId: source.importBatchId ?? null,
    })
    .returning();
  if (input.tags?.length) await setTags(db, userId, task.id, input.tags);
  return task;
}

export async function updateTask(db: Database, userId: string, id: string, patch: TaskPatch): Promise<Task> {
  const current = await ownedTask(db, userId, id);
  if (patch.listId !== undefined) await assertList(db, userId, patch.listId);
  const dueDate = patch.dueDate !== undefined ? patch.dueDate : current.dueDate;
  const [task] = await db
    .update(tasks)
    .set({
      ...(patch.title !== undefined && { title: patch.title.trim() }),
      ...(patch.notes !== undefined && { notes: patch.notes }),
      ...(patch.listId !== undefined && { listId: patch.listId }),
      ...(patch.dueDate !== undefined && { dueDate: patch.dueDate }),
      ...(patch.dueTime !== undefined && { dueTime: patch.dueTime }),
      ...(!dueDate && { dueTime: null }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.recurrence !== undefined && { recurrence: patch.recurrence }),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();
  if (patch.tags) await setTags(db, userId, id, patch.tags);
  return task;
}

/** Checks or unchecks a task. Returns the task as saved. */
export async function setCompleted(
  db: Database,
  userId: string,
  id: string,
  done: boolean,
  now: Date = new Date(),
): Promise<Task> {
  await ownedTask(db, userId, id);
  const [task] = await db
    .update(tasks)
    .set({ completedAt: done ? now : null, updatedAt: now })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();
  return task;
}

export async function deleteTask(db: Database, userId: string, id: string): Promise<void> {
  await ownedTask(db, userId, id);
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

/** Moves tasks to the given order (ids in display order). */
export async function reorderTasks(db: Database, userId: string, orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const owned = await db
    .select({ id: tasks.id, position: tasks.position })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, orderedIds)));
  if (owned.length !== new Set(orderedIds).size) throw new NotFoundError("Task");
  // Reuse the same set of positions, so other tasks keep their place.
  const positions = owned.map((t) => t.position).sort((a, b) => a - b);
  for (const [i, id] of orderedIds.entries()) {
    await db.update(tasks).set({ position: positions[i] }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }
}

async function decorate(db: Database, userId: string, rows: Task[]): Promise<TaskView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((t) => t.id);
  const listIds = [...new Set(rows.map((t) => t.listId).filter((v): v is string => !!v))];
  const [listRows, subRows, tagRows] = await Promise.all([
    listIds.length
      ? db.select({ id: lists.id, name: lists.name, color: lists.color }).from(lists).where(inArray(lists.id, listIds))
      : Promise.resolve([]),
    db
      .select({
        parentId: tasks.parentId,
        total: count(),
        done: sql<number>`count(${tasks.completedAt})`.mapWith(Number),
      })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.parentId, ids)))
      .groupBy(tasks.parentId),
    db
      .select({ taskId: taskTags.taskId, name: tags.name })
      .from(taskTags)
      .innerJoin(tags, eq(tags.id, taskTags.tagId))
      .where(inArray(taskTags.taskId, ids)),
  ]);
  const listById = new Map(listRows.map((l) => [l.id, l]));
  const subByParent = new Map(subRows.map((s) => [s.parentId, s]));
  return rows.map((t) => ({
    ...t,
    list: t.listId ? (listById.get(t.listId) ?? null) : null,
    subtasks: { done: subByParent.get(t.id)?.done ?? 0, total: subByParent.get(t.id)?.total ?? 0 },
    tagNames: tagRows.filter((r) => r.taskId === t.id).map((r) => r.name),
  }));
}

export type TodayTasks = { overdue: TaskView[]; today: TaskView[]; done: TaskView[] };

/**
 * The Today checklist: open tasks due today or earlier, and tasks checked today.
 * `startOfToday` is the UTC instant of the user's local midnight.
 */
export async function getTodayTasks(
  db: Database,
  userId: string,
  today: string,
  startOfToday: Date,
): Promise<TodayTasks> {
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.parentId),
        or(
          and(isNull(tasks.completedAt), isNotNull(tasks.dueDate), lte(tasks.dueDate, today)),
          gte(tasks.completedAt, startOfToday),
        ),
      ),
    )
    .orderBy(asc(tasks.position));
  const views = await decorate(db, userId, rows);
  const byTime = (a: TaskView, b: TaskView) =>
    (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99") || a.position - b.position;
  return {
    overdue: views.filter((t) => !t.completedAt && t.dueDate! < today),
    today: views.filter((t) => !t.completedAt && t.dueDate === today).sort(byTime),
    done: views
      .filter((t) => t.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime()),
  };
}

/** Open tasks of one list (or with no list), any date. */
export async function getListTasks(db: Database, userId: string, listId: string | null): Promise<TaskView[]> {
  if (listId) await assertList(db, userId, listId);
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.parentId),
        isNull(tasks.completedAt),
        listId ? eq(tasks.listId, listId) : isNull(tasks.listId),
      ),
    )
    .orderBy(asc(tasks.position));
  return decorate(db, userId, rows);
}

/** Open tasks due after today, for the "upcoming" part of the agenda. */
export async function getUpcomingTasks(db: Database, userId: string, today: string, until: string) {
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        isNull(tasks.parentId),
        isNull(tasks.completedAt),
        sql`${tasks.dueDate} > ${today}`,
        lte(tasks.dueDate, until),
      ),
    )
    .orderBy(asc(tasks.dueDate), asc(tasks.dueTime), asc(tasks.position));
  return decorate(db, userId, rows);
}

export type TaskDetail = TaskView & { subtaskList: Task[] };

export async function getTask(db: Database, userId: string, id: string): Promise<TaskDetail> {
  const task = await ownedTask(db, userId, id);
  const [view] = await decorate(db, userId, [task]);
  const subtaskList = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.parentId, id)))
    .orderBy(asc(tasks.position));
  return { ...view, subtaskList };
}

export type ListView = List & { openCount: number };

export async function getLists(db: Database, userId: string): Promise<ListView[]> {
  const rows = await db.select().from(lists).where(eq(lists.ownerId, userId)).orderBy(asc(lists.position));
  const counts = await db
    .select({ listId: tasks.listId, open: count() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.completedAt), isNull(tasks.parentId)))
    .groupBy(tasks.listId);
  const byList = new Map(counts.map((c) => [c.listId, c.open]));
  return rows.map((l) => ({ ...l, openCount: byList.get(l.id) ?? 0 }));
}

export async function countInbox(db: Database, userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.listId), isNull(tasks.completedAt), isNull(tasks.parentId)));
  return row.n;
}

export async function createList(db: Database, userId: string, name: string, color: string | null = null) {
  const [{ last }] = await db.select({ last: max(lists.position) }).from(lists).where(eq(lists.ownerId, userId));
  const [list] = await db
    .insert(lists)
    .values({ id: newId(), ownerId: userId, name: name.trim(), color, position: (last ?? 0) + 1 })
    .returning();
  return list;
}

export async function updateList(db: Database, userId: string, id: string, patch: { name?: string; color?: string | null }) {
  await assertList(db, userId, id);
  const [list] = await db
    .update(lists)
    .set({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.color !== undefined && { color: patch.color }),
    })
    .where(and(eq(lists.id, id), eq(lists.ownerId, userId)))
    .returning();
  return list;
}

/** Deletes a list. Its tasks are kept and move to the inbox. */
export async function deleteList(db: Database, userId: string, id: string): Promise<void> {
  await assertList(db, userId, id);
  await db.delete(lists).where(and(eq(lists.id, id), eq(lists.ownerId, userId)));
}

export type ImportSummary = { batchId: string; count: number; kinds: SourceKind[] };

/** The most recent batch of tasks Claude created since `since`, if any. */
export async function getLatestImport(db: Database, userId: string, since: Date): Promise<ImportSummary | null> {
  const [latest] = await db
    .select({ batchId: tasks.importBatchId })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNotNull(tasks.importBatchId), gte(tasks.createdAt, since)))
    .orderBy(desc(tasks.createdAt))
    .limit(1);
  if (!latest?.batchId) return null;
  const rows = await db
    .select({ kind: tasks.sourceKind })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.importBatchId, latest.batchId), isNull(tasks.parentId)));
  if (rows.length === 0) return null;
  const kinds = [...new Set(rows.map((r) => r.kind).filter((k): k is SourceKind => !!k))];
  return { batchId: latest.batchId, count: rows.length, kinds };
}

/** Deletes every task of an import batch. Returns how many were removed. */
export async function undoImport(db: Database, userId: string, batchId: string): Promise<number> {
  const removed = await db
    .delete(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.importBatchId, batchId)))
    .returning({ id: tasks.id });
  return removed.length;
}

/** Overdue open tasks, oldest first (evening review, morning briefing). */
export async function getOpenTasksBefore(db: Database, userId: string, day: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.parentId), isNull(tasks.completedAt), lt(tasks.dueDate, day)))
    .orderBy(asc(tasks.dueDate));
}
