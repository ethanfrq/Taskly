import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export const LOCAL_DATA_DIR = ".data/pglite";

type AnyDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Creates a database client.
 * - A postgres:// URL connects to Postgres.
 * - "memory://" opens an in-memory PGlite database (tests).
 * - No URL opens the PGlite database stored in `.data/pglite`, except on
 *   Vercel, whose file system doesn't keep it: there it is an error.
 */
export function createDatabase(url?: string): AnyDatabase {
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const pool = new Pool({ connectionString: url, max: 5 });
    return drizzlePg(pool, { schema }) as unknown as AnyDatabase;
  }
  if (url !== "memory://" && process.env.VERCEL) {
    throw new Error("DATABASE_URL is missing. On Vercel, add a Neon Postgres database from the Marketplace (docs/self-hosting.md).");
  }
  const client = url === "memory://" ? new PGlite() : new PGlite(LOCAL_DATA_DIR);
  return drizzlePglite(client, { schema }) as unknown as AnyDatabase;
}
