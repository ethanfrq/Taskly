import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

/*
 * Request counters for Better Auth's rate limiter (storage "database"), so
 * the limits hold across serverless instances. Keys are "<ip>|<path>", plus
 * Taskly's own "email-code|<sha256 of the address>" quota (src/lib/auth/quota.ts).
 * The export name must match Better Auth's model name.
 */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  /** Milliseconds since the epoch, as Better Auth writes it. */
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
