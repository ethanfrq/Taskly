import type { OutboxOp } from "@/lib/offline/outbox";
import type { TaskView } from "@/lib/tasks/service";

export type NewTaskInput = Extract<OutboxOp, { kind: "create" }>["input"];

/** How a task the server hasn't confirmed yet shows in a list: just typed, or queued offline. */
export function draftTask(id: string, input: NewTaskInput, at: number): TaskView {
  return {
    id,
    title: input.title,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    priority: input.priority,
    completedAt: null,
    list: null,
    listId: null,
    parentId: null,
    assigneeId: null,
    assignee: null,
    notes: null,
    recurrence: input.recurrence,
    source: "manual",
    sourceKind: null,
    sourceUrl: null,
    sourceLabel: null,
    importBatchId: null,
    userEditedAt: null,
    tagNames: input.tags,
    subtasks: { done: 0, total: 0 },
    position: Number.MAX_SAFE_INTEGER,
    userId: "",
    createdAt: new Date(at),
    updatedAt: new Date(at),
  };
}
