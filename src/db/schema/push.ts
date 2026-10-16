import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/** One row per device that accepted notifications (Web Push subscription). */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  },
  (t) => [index("push_subscriptions_user_idx").on(t.userId)],
);

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
