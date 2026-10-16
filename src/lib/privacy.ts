import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { events, focusSessions, listMembers, lists, passkey, preferences, pushSubscriptions, reminders, tags, taskTags, tasks, user } from "@/db/schema";

function without<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  return Object.fromEntries(Object.entries(value).filter(([k]) => k !== key)) as Omit<T, K>;
}

/**
 * Everything Taskly stores about a user, as plain JSON (GDPR right of access
 * and portability). Secrets are left out: session tokens, push encryption
 * keys and passkey public keys identify devices, they aren't the user's data.
 */
export async function exportUserData(db: Database, userId: string) {
  const [profile] = await db
    .select({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  const [prefs] = await db.select().from(preferences).where(eq(preferences.userId, userId));
  const [listRows, taskRows, tagRows, reminderRows, deviceRows, passkeyRows, eventRows, focusRows, memberships] = await Promise.all([
    db.select().from(lists).where(eq(lists.ownerId, userId)).orderBy(asc(lists.position)),
    db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.createdAt)),
    db.select({ taskId: taskTags.taskId, name: tags.name }).from(taskTags).innerJoin(tags, eq(tags.id, taskTags.tagId)).where(eq(tags.userId, userId)),
    db
      .select({ kind: reminders.kind, taskId: reminders.taskId, dueAt: reminders.dueAt, sentAt: reminders.sentAt })
      .from(reminders)
      .where(eq(reminders.userId, userId)),
    db
      .select({ userAgent: pushSubscriptions.userAgent, createdAt: pushSubscriptions.createdAt, lastSuccessAt: pushSubscriptions.lastSuccessAt })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId)),
    db.select({ name: passkey.name, deviceType: passkey.deviceType, createdAt: passkey.createdAt }).from(passkey).where(eq(passkey.userId, userId)),
    db.select().from(events).where(eq(events.userId, userId)).orderBy(asc(events.startsAt)),
    db.select({ minutes: focusSessions.minutes, taskId: focusSessions.taskId, endedAt: focusSessions.endedAt }).from(focusSessions).where(eq(focusSessions.userId, userId)),
    db.select({ listId: listMembers.listId, joinedAt: listMembers.joinedAt }).from(listMembers).where(eq(listMembers.userId, userId)),
  ]);

  const tagsByTask = new Map<string, string[]>();
  for (const row of tagRows) tagsByTask.set(row.taskId, [...(tagsByTask.get(row.taskId) ?? []), row.name]);

  return {
    format: "taskly-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    account: profile,
    preferences: prefs ? Object.fromEntries(Object.entries(prefs).filter(([key]) => key !== "userId")) : null,
    lists: listRows.map((list) => without(list, "ownerId")),
    sharedListsJoined: memberships,
    tasks: taskRows.map((task) => ({ ...without(task, "userId"), tags: tagsByTask.get(task.id) ?? [] })),
    reminders: reminderRows,
    events: eventRows.map((event) => without(event, "userId")),
    focusSessions: focusRows,
    devices: { notifications: deviceRows, passkeys: passkeyRows },
  };
}

/**
 * Deletes the account and, through foreign keys, everything attached to it:
 * sessions, passkeys, preferences, lists, tasks, tags, reminders, devices.
 */
export async function deleteUserData(db: Database, userId: string): Promise<void> {
  await db.delete(user).where(eq(user.id, userId));
}
