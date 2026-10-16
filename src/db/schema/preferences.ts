import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Per-user settings chosen during onboarding (docs/design/DECISIONS.md D-002, D-007).
 * Times are "HH:MM" strings in the user's own time zone.
 */
export const preferences = pgTable("preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  locale: text("locale").notNull().default("fr"),
  timeZone: text("time_zone").notNull().default("Europe/Paris"),
  accent: text("accent").notNull().default("#007AFF"),
  appearance: text("appearance", { enum: ["light", "dark", "auto"] }).notNull().default("auto"),
  briefingTime: text("briefing_time").notNull().default("07:30"),
  reviewTime: text("review_time").notNull().default("18:30"),
  quietStart: text("quiet_start").notNull().default("21:00"),
  quietEnd: text("quiet_end").notNull().default("07:00"),
  /** 1 to 4, see D-007. */
  insistence: integer("insistence").notNull().default(2),
  followUpPriorityOnly: boolean("follow_up_priority_only").notNull().default(true),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Preferences = typeof preferences.$inferSelect;
