import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { SOURCE_KINDS } from "../../lib/tasks/sources";
import { user } from "./auth";

/** Calendar events Claude copies from the user's calendars, for the agenda and the "Next" tile. */
export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    allDay: boolean("all_day").notNull().default(false),
    location: text("location"),
    sourceKind: text("source_kind", { enum: SOURCE_KINDS }),
    sourceUrl: text("source_url"),
    /** The calendar's own event id, so Claude can resend an event without duplicating it. */
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_user_start_idx").on(t.userId, t.startsAt), uniqueIndex("events_user_external_idx").on(t.userId, t.externalId)],
);

export type CalendarEvent = typeof events.$inferSelect;
