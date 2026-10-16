import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { createDatabase } from "./client";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { taskly_db?: Database };

/**
 * The app database. Postgres when DATABASE_URL is set (Neon in production),
 * an embedded PGlite database in `.data/` otherwise, for local development.
 */
export function getDb(): Database {
  globalForDb.taskly_db ??= createDatabase(process.env.DATABASE_URL);
  return globalForDb.taskly_db;
}

export { schema };
