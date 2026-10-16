"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/session";
import * as service from "@/lib/tasks/service";
import { getPreferences } from "@/lib/preferences";
import { reminderDeps } from "@/lib/reminders/runtime";
import { moveTaskToTomorrow, snoozeTask, syncTaskReminders } from "@/lib/reminders/service";
import { isRecurrence } from "@/lib/tasks/recurrence";
import { isValidDay, isValidTime, todayIn } from "@/lib/time";

const id = z.string().min(1).max(64);
const day = z.string().refine(isValidDay).nullable();
const time = z.string().refine(isValidTime).nullable();
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable();

const taskFields = {
  title: z.string().trim().min(1).max(500),
  notes: z.string().max(10_000).nullable().optional(),
  listId: id.nullable().optional(),
  dueDate: day.optional(),
  dueTime: time.optional(),
  priority: z.number().int().min(0).max(3).optional(),
  recurrence: z.string().refine(isRecurrence).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
};

const createSchema = z.object({
  ...taskFields,
  parentId: id.nullable().optional(),
  /** From "@list" in the quick add field; resolved to listId here. */
  listName: z.string().trim().min(1).max(80).optional(),
});
const patchSchema = z.object(taskFields).partial();

function refresh() {
  revalidatePath("/", "layout");
}

/** Keeps reminders in line with tasks. A scheduler hiccup must not lose the user's change. */
async function syncReminders(userId: string, ...taskIds: (string | undefined)[]) {
  const deps = reminderDeps();
  for (const taskId of taskIds) {
    if (!taskId) continue;
    try {
      await syncTaskReminders(deps, userId, taskId);
    } catch (error) {
      console.error(`Reminder sync failed for task ${taskId}`, error);
    }
  }
}

export async function createTaskAction(input: z.input<typeof createSchema>) {
  const user = await requireUser();
  const { listName, ...data } = createSchema.parse(input);
  const db = getDb();
  if (listName && !data.listId) data.listId = (await service.findListByName(db, user.id, listName))?.id ?? null;
  const task = await service.createTask(db, user.id, data);
  await syncReminders(user.id, task.id);
  refresh();
  return { id: task.id };
}

export async function updateTaskAction(taskId: string, patch: z.input<typeof patchSchema>) {
  const user = await requireUser();
  await service.updateTask(getDb(), user.id, id.parse(taskId), patchSchema.parse(patch));
  await syncReminders(user.id, taskId);
  refresh();
}

export async function toggleTaskAction(taskId: string, done: boolean) {
  const user = await requireUser();
  const db = getDb();
  const { timeZone } = await getPreferences(db, user.id);
  const { next } = await service.setCompleted(db, user.id, id.parse(taskId), z.boolean().parse(done), new Date(), todayIn(timeZone));
  await syncReminders(user.id, taskId, next?.id);
  refresh();
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireUser();
  await service.deleteTask(getDb(), user.id, id.parse(taskId));
  refresh();
}

export async function reorderTasksAction(orderedIds: string[]) {
  const user = await requireUser();
  await service.reorderTasks(getDb(), user.id, z.array(id).max(500).parse(orderedIds));
  refresh();
}

export async function undoImportAction(batchId: string) {
  const user = await requireUser();
  const removed = await service.undoImport(getDb(), user.id, id.parse(batchId));
  refresh();
  return { removed };
}

const listSchema = z.object({ name: z.string().trim().min(1).max(80), color: hex.optional() });

export async function createListAction(input: z.input<typeof listSchema>) {
  const user = await requireUser();
  const data = listSchema.parse(input);
  const list = await service.createList(getDb(), user.id, data.name, data.color ?? null);
  refresh();
  return { id: list.id };
}

export async function updateListAction(listId: string, patch: Partial<z.input<typeof listSchema>>) {
  const user = await requireUser();
  await service.updateList(getDb(), user.id, id.parse(listId), listSchema.partial().parse(patch));
  refresh();
}

export async function deleteListAction(listId: string) {
  const user = await requireUser();
  await service.deleteList(getDb(), user.id, id.parse(listId));
  refresh();
}

const snoozePreset = z.enum(["15", "60", "tomorrow"]);

/** "Remind me in 15 min / 1 h / tomorrow" from the task screen. */
export async function snoozeTaskAction(taskId: string, preset: z.input<typeof snoozePreset>) {
  const user = await requireUser();
  const choice = snoozePreset.parse(preset);
  const deps = reminderDeps();
  if (choice === "tomorrow") {
    await moveTaskToTomorrow(deps, user.id, id.parse(taskId));
  } else {
    await snoozeTask(deps, user.id, id.parse(taskId), new Date(Date.now() + Number(choice) * 60_000));
  }
  refresh();
}

/** Evening review: carry tasks over to tomorrow. */
export async function moveToTomorrowAction(taskIds: string[]) {
  const user = await requireUser();
  const deps = reminderDeps();
  for (const taskId of z.array(id).max(200).parse(taskIds)) await moveTaskToTomorrow(deps, user.id, taskId);
  refresh();
}
