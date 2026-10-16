"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/session";
import * as service from "@/lib/tasks/service";
import { isValidDay, isValidTime } from "@/lib/time";

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
  recurrence: z.string().max(64).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
};

const createSchema = z.object({ ...taskFields, parentId: id.nullable().optional() });
const patchSchema = z.object(taskFields).partial();

function refresh() {
  revalidatePath("/", "layout");
}

export async function createTaskAction(input: z.input<typeof createSchema>) {
  const user = await requireUser();
  const data = createSchema.parse(input);
  const task = await service.createTask(getDb(), user.id, data);
  refresh();
  return { id: task.id };
}

export async function updateTaskAction(taskId: string, patch: z.input<typeof patchSchema>) {
  const user = await requireUser();
  await service.updateTask(getDb(), user.id, id.parse(taskId), patchSchema.parse(patch));
  refresh();
}

export async function toggleTaskAction(taskId: string, done: boolean) {
  const user = await requireUser();
  await service.setCompleted(getDb(), user.id, id.parse(taskId), z.boolean().parse(done));
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
