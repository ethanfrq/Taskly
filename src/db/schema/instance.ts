import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/*
 * Secrets a personal instance generates for itself on first start, so its
 * owner doesn't have to (src/lib/personal.ts). Not user data.
 */
export const instanceSecrets = pgTable("instance_secrets", {
  name: text("name").primaryKey(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
