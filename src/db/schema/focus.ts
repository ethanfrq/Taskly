import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { tasks } from "./tasks";

/** A finished focus session (Pomodoro), for the weekly stats. */
export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
    minutes: integer("minutes").notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("focus_sessions_user_idx").on(t.userId, t.endedAt)],
);
