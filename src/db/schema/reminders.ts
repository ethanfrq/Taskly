import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { tasks } from "./tasks";

export const REMINDER_KINDS = ["task", "follow-up", "briefing", "review"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

/**
 * A notification to send at a given instant. Rows are the source of truth:
 * the scheduler (QStash or the local sweep) only wakes the server up.
 */
export const reminders = pgTable(
  "reminders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: REMINDER_KINDS }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    /** 0 for the first reminder, then 1, 2… for follow-ups. */
    attempt: integer("attempt").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reminders_due_idx").on(t.dueAt),
    index("reminders_task_idx").on(t.taskId),
    index("reminders_user_kind_idx").on(t.userId, t.kind),
  ],
);

export type Reminder = typeof reminders.$inferSelect;
