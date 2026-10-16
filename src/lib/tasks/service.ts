import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, max, or, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { type List, type SourceKind, type Task, listMembers, lists, tags, taskTags, tasks, user } from "@/db/schema";
import { isRecurrence, nextOccurrence } from "./recurrence";

/*
 * Task and list data access. Every function takes the user id from the
 * session (never from the client) and only reaches what that user may see:
 * their own tasks, tasks assigned to them, and tasks in lists they own or
 * were invited to.
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
  /** Shared lists only: a member of the list. */
  assigneeId?: string | null;
};

export type TaskPatch = Partial<Omit<TaskInput, "parentId">>;

export type TaskView = Task & {
  list: Pick<List, "id" | "name" | "color"> | null;
  assignee: { id: string; name: string } | null;
  subtasks: { done: number; total: number };
  tagNames: string[];
};

const newId = () => crypto.randomUUID();

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
  }
}

/** Ids of the lists a user owns or was invited to. */
export async function accessibleListIds(db: Database, userId: string): Promise<string[]> {
  const [owned, joined] = await Promise.all([
    db.select({ id: lists.id }).from(lists).where(eq(lists.ownerId, userId)),
    db.select({ id: listMembers.listId }).from(listMembers).where(eq(listMembers.userId, userId)),
  ]);
  return [...owned, ...joined].map((row) => row.id);
}

async function assertList(db: Database, userId: string, listId: string | null | undefined) {
  if (!listId) return;
  if (!(await accessibleListIds(db, userId)).includes(listId)) throw new NotFoundError("List");
}

async function assertOwnedList(db: Database, userId: string, listId: string): Promise<List> {
  const [row] = await db.select().from(lists).where(and(eq(lists.id, listId), eq(lists.ownerId, userId)));
  if (!row) throw new NotFoundError("List");
  return row;
}

/** A task the user may see and change, or NotFoundError (never "forbidden": no existence leak). */
async function ownedTask(db: Database, userId: string, id: string): Promise<Task> {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!row) throw new NotFoundError("Task");
  if (row.userId === userId || row.assigneeId === userId) return row;
  if (row.listId && (await accessibleListIds(db, userId)).includes(row.listId)) return row;
  throw new NotFoundError("Task");
}

/** The tasks that belong on a user's own day: assigned to them, or theirs and unassigned. */
const onMyDay = (userId: string) =>
  or(eq(tasks.assigneeId, userId), and(isNull(tasks.assigneeId), eq(tasks.userId, userId)));

/** People who can be assigned a task in a list: its owner and members. */
async function listParticipants(db: Database, listId: string): Promise<string[]> {
  const [list] = await db.select({ ownerId: lists.ownerId }).from(lists).where(eq(lists.id, listId));
  if (!list) return [];
  const members = await db.select({ userId: listMembers.userId }).from(listMembers).where(eq(listMembers.listId, listId));
  return [list.ownerId, ...members.map((m) => m.userId)];
}

async function assertAssignee(db: Database, listId: string | null, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  if (!listId || !(await listParticipants(db, listId)).includes(assigneeId)) throw new NotFoundError("Assignee");
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
  await assertAssignee(db, input.listId ?? null, input.assigneeId);
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
      assigneeId: input.assigneeId ?? null,
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
  const listId = patch.listId !== undefined ? patch.listId : current.listId;
  if (patch.assigneeId !== undefined) await assertAssignee(db, listId, patch.assigneeId);
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
      ...(patch.assigneeId !== undefined && { assigneeId: patch.assigneeId }),
      // Leaving a shared list drops the assignment.
      ...(patch.listId !== undefined && patch.listId !== current.listId && { assigneeId: null }),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  if (patch.tags) await setTags(db, userId, id, patch.tags);
  return task;
}

/**
 * Checks or unchecks a task. Checking a recurring task creates its next
 * occurrence, which takes over the rule (so unchecking can't duplicate it).
 * `today` is the user's local day, used to catch up after a late check.
 */
export async function setCompleted(
  db: Database,
  userId: string,
  id: string,
  done: boolean,
  now: Date = new Date(),
  today?: string,
): Promise<{ task: Task; next: Task | null }> {
  const current = await ownedTask(db, userId, id);
  const recurring = done && !current.completedAt && current.recurrence && isRecurrence(current.recurrence);
  const [task] = await db
    .update(tasks)
    .set({ completedAt: done ? now : null, updatedAt: now, ...(recurring && { recurrence: null }) })
    .where(eq(tasks.id, id))
    .returning();
  if (!recurring || !current.recurrence || !isRecurrence(current.recurrence)) return { task, next: null };

  const anchor = current.dueDate ?? today ?? now.toISOString().slice(0, 10);
  const after = today && today > anchor ? today : anchor;
  const tagRows = await db
    .select({ name: tags.name })
    .from(taskTags)
    .innerJoin(tags, eq(tags.id, taskTags.tagId))
    .where(eq(taskTags.taskId, id));
  // The next occurrence keeps its creator and assignee, whoever checked this one.
  const next = await createTask(
    db,
    current.userId,
    {
      title: current.title,
      notes: current.notes,
      listId: current.listId,
      dueDate: nextOccurrence(current.recurrence, anchor, after),
      dueTime: current.dueTime,
      priority: current.priority,
      recurrence: current.recurrence,
      tags: tagRows.map((t) => t.name),
      assigneeId: current.assigneeId,
    },
    { source: current.source, sourceKind: current.sourceKind, sourceUrl: current.sourceUrl, sourceLabel: current.sourceLabel },
  );
  return { task, next };
}

/** Finds one of the user's lists by name, ignoring case and spaces. */
export async function findListByName(db: Database, userId: string, name: string): Promise<List | null> {
  const wanted = name.toLowerCase().replace(/\s+/g, "");
  const ids = await accessibleListIds(db, userId);
  const rows = ids.length ? await db.select().from(lists).where(inArray(lists.id, ids)) : [];
  return rows.find((l) => l.name.toLowerCase().replace(/\s+/g, "") === wanted) ?? null;
}

export async function deleteTask(db: Database, userId: string, id: string): Promise<void> {
  await ownedTask(db, userId, id);
  await db.delete(tasks).where(eq(tasks.id, id));
}

/** Moves tasks to the given order (ids in display order). */
export async function reorderTasks(db: Database, userId: string, orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const owned = await Promise.all([...new Set(orderedIds)].map((id) => ownedTask(db, userId, id)));
  // Reuse the same set of positions, so other tasks keep their place.
  const positions = owned.map((t) => t.position).sort((a, b) => a - b);
  for (const [i, id] of orderedIds.entries()) {
    await db.update(tasks).set({ position: positions[i] }).where(eq(tasks.id, id));
  }
}

async function decorate(db: Database, userId: string, rows: Task[]): Promise<TaskView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((t) => t.id);
  const listIds = [...new Set(rows.map((t) => t.listId).filter((v): v is string => !!v))];
  const assigneeIds = [...new Set(rows.map((t) => t.assigneeId).filter((v): v is string => !!v))];
  const [listRows, subRows, tagRows, assigneeRows] = await Promise.all([
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
      .where(inArray(tasks.parentId, ids))
      .groupBy(tasks.parentId),
    db
      .select({ taskId: taskTags.taskId, name: tags.name })
      .from(taskTags)
      .innerJoin(tags, eq(tags.id, taskTags.tagId))
      .where(inArray(taskTags.taskId, ids)),
    assigneeIds.length
      ? db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(inArray(user.id, assigneeIds))
      : Promise.resolve([]),
  ]);
  const assigneeById = new Map(assigneeRows.map((a) => [a.id, { id: a.id, name: a.name || a.email.split("@")[0] }]));
  const listById = new Map(listRows.map((l) => [l.id, l]));
  const subByParent = new Map(subRows.map((s) => [s.parentId, s]));
  return rows.map((t) => ({
    ...t,
    list: t.listId ? (listById.get(t.listId) ?? null) : null,
    assignee: t.assigneeId ? (assigneeById.get(t.assigneeId) ?? null) : null,
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
        onMyDay(userId),
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
        isNull(tasks.parentId),
        isNull(tasks.completedAt),
        listId ? eq(tasks.listId, listId) : and(eq(tasks.userId, userId), isNull(tasks.listId)),
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
        onMyDay(userId),
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
    .where(eq(tasks.parentId, id))
    .orderBy(asc(tasks.position));
  return { ...view, subtaskList };
}

export type ListView = List & { openCount: number; isOwner: boolean; memberCount: number };

/** The user's lists: their own first, then the ones shared with them. */
export async function getLists(db: Database, userId: string): Promise<ListView[]> {
  const ids = await accessibleListIds(db, userId);
  if (ids.length === 0) return [];
  const [rows, counts, members] = await Promise.all([
    db.select().from(lists).where(inArray(lists.id, ids)).orderBy(asc(lists.position)),
    db
      .select({ listId: tasks.listId, open: count() })
      .from(tasks)
      .where(and(inArray(tasks.listId, ids), isNull(tasks.completedAt), isNull(tasks.parentId)))
      .groupBy(tasks.listId),
    db.select({ listId: listMembers.listId, n: count() }).from(listMembers).where(inArray(listMembers.listId, ids)).groupBy(listMembers.listId),
  ]);
  const byList = new Map(counts.map((c) => [c.listId, c.open]));
  const memberCount = new Map(members.map((m) => [m.listId, m.n]));
  return rows
    .map((l) => ({ ...l, openCount: byList.get(l.id) ?? 0, isOwner: l.ownerId === userId, memberCount: memberCount.get(l.id) ?? 0 }))
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || a.position - b.position);
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
  await assertOwnedList(db, userId, id);
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
  await assertOwnedList(db, userId, id);
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

/* ---------- Shared lists ---------- */

const inviteToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Turns sharing on (or gives a new link, which invalidates the old one). Owner only. */
export async function shareList(db: Database, userId: string, listId: string): Promise<string> {
  await assertOwnedList(db, userId, listId);
  const token = inviteToken();
  await db.update(lists).set({ inviteToken: token }).where(eq(lists.id, listId));
  return token;
}

/** Disables the invite link. Members already in the list stay. Owner only. */
export async function disableInvite(db: Database, userId: string, listId: string): Promise<void> {
  await assertOwnedList(db, userId, listId);
  await db.update(lists).set({ inviteToken: null }).where(eq(lists.id, listId));
}

/** What an invite link points to, for the join page. */
export async function getInvite(db: Database, token: string) {
  const [row] = await db
    .select({ id: lists.id, name: lists.name, color: lists.color, ownerId: lists.ownerId, ownerName: user.name, ownerEmail: user.email })
    .from(lists)
    .innerJoin(user, eq(user.id, lists.ownerId))
    .where(eq(lists.inviteToken, token));
  return row ?? null;
}

export async function joinList(db: Database, userId: string, token: string): Promise<string> {
  const invite = await getInvite(db, token);
  if (!invite) throw new NotFoundError("Invite");
  if (invite.ownerId !== userId) {
    await db.insert(listMembers).values({ listId: invite.id, userId }).onConflictDoNothing();
  }
  return invite.id;
}

/** Leaves a shared list; tasks assigned to the user there become unassigned. */
export async function leaveList(db: Database, userId: string, listId: string): Promise<void> {
  await db.delete(listMembers).where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)));
  await db.update(tasks).set({ assigneeId: null }).where(and(eq(tasks.listId, listId), eq(tasks.assigneeId, userId)));
}

/** Owner removes someone from the list. */
export async function removeMember(db: Database, userId: string, listId: string, memberId: string): Promise<void> {
  await assertOwnedList(db, userId, listId);
  await leaveList(db, memberId, listId);
}

export type Participant = { id: string; name: string; email: string; isOwner: boolean };

export async function getParticipants(db: Database, userId: string, listId: string): Promise<Participant[]> {
  await assertList(db, userId, listId);
  const ids = await listParticipants(db, listId);
  const [list] = await db.select({ ownerId: lists.ownerId }).from(lists).where(eq(lists.id, listId));
  const people = await db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(inArray(user.id, ids));
  return people
    .map((p) => ({ ...p, isOwner: p.id === list.ownerId }))
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || a.email.localeCompare(b.email));
}
