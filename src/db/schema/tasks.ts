import { type AnyPgColumn, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { SOURCE_KINDS } from "../../lib/tasks/sources";
import { user } from "./auth";

export { SOURCE_KINDS, type SourceKind } from "../../lib/tasks/sources";

export const lists = pgTable(
  "lists",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Hex color for the list's dot, or null to use the accent. */
    color: text("color"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lists_owner_idx").on(t.ownerId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    listId: text("list_id").references(() => lists.id, { onDelete: "set null" }),
    parentId: text("parent_id").references((): AnyPgColumn => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes"),
    /** Calendar day in the user's time zone, "YYYY-MM-DD". Null: someday. */
    dueDate: text("due_date"),
    /** Local time "HH:MM", only meaningful with dueDate. */
    dueTime: text("due_time"),
    /** 0 none, 1 low (!), 2 medium (!!), 3 high (!!!). */
    priority: integer("priority").notNull().default(0),
    position: integer("position").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** "manual" or "claude" (created through MCP). */
    source: text("source", { enum: ["manual", "claude"] }).notNull().default("manual"),
    sourceKind: text("source_kind", { enum: SOURCE_KINDS }),
    sourceUrl: text("source_url"),
    sourceLabel: text("source_label"),
    /** Groups the tasks Claude created in one call, so the import can be undone. */
    importBatchId: text("import_batch_id"),
    /** Recurrence rule, see src/lib/tasks/recurrence.ts. */
    recurrence: text("recurrence"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_user_due_idx").on(t.userId, t.dueDate),
    index("tasks_list_idx").on(t.listId),
    index("tasks_parent_idx").on(t.parentId),
    index("tasks_batch_idx").on(t.importBatchId),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("tags_user_name_idx").on(t.userId, t.name)],
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })],
);

export type List = typeof lists.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Tag = typeof tags.$inferSelect;
