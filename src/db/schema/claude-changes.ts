import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/** A task as it was before Claude changed it, enough to put it back (dates as ISO strings). */
export type TaskSnapshot = {
  id: string;
  listId: string | null;
  assigneeId: string | null;
  title: string;
  notes: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: number;
  position: number;
  sourceKind: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  importBatchId: string | null;
  createdAt: string;
  tagNames: string[];
};

/** The fields a refresh changed, old and new values. */
export type FieldChanges = Partial<Record<"title" | "notes" | "dueDate" | "dueTime" | "priority", { from: unknown; to: unknown }>>;

/**
 * What Claude changed in existing tasks during a refresh: one row per task,
 * grouped by batch, so the user sees why and can undo it (src/lib/tasks/refresh.ts).
 * No foreign key to tasks: a removed task must keep its row to be restored.
 */
export const claudeChanges = pgTable(
  "claude_changes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    batchId: text("batch_id").notNull(),
    /** Order within the batch: shown in that order, undone in reverse. */
    position: integer("position").notNull(),
    taskId: text("task_id").notNull(),
    action: text("action", { enum: ["update", "complete", "remove"] }).notNull(),
    /** The task's title when Claude changed it, for the summary. */
    title: text("title").notNull(),
    /** Why, in Claude's words: "Sarah replied", "Meeting cancelled". */
    reason: text("reason").notNull(),
    before: jsonb("before").$type<TaskSnapshot>().notNull(),
    changes: jsonb("changes").$type<FieldChanges>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    undoneAt: timestamp("undone_at", { withTimezone: true }),
  },
  (t) => [index("claude_changes_user_idx").on(t.userId, t.createdAt), index("claude_changes_batch_idx").on(t.batchId)],
);
