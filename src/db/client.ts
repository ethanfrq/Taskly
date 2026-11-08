import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { attachDatabasePool } from "@vercel/functions";
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
    const pool = new Pool({
      connectionString: url,
      max: 5,
      // Without these limits a dead connection (the instance was paused between requests)
      // made a query wait until Vercel's 300 s timeout: billed, and the request still failed.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
      query_timeout: 25_000,
    });
    // On Vercel (Fluid compute), closes idle connections before the instance is suspended.
    if (process.env.VERCEL) attachDatabasePool(pool);
    return drizzlePg(pool, { schema }) as unknown as AnyDatabase;
  }
  if (url !== "memory://" && process.env.VERCEL) {
    throw new Error("DATABASE_URL is missing. On Vercel, add a Neon Postgres database from the Marketplace (docs/self-hosting.md).");
  }
  if (url === "memory://") return drizzlePglite(new PGlite(), { schema }) as unknown as AnyDatabase;
  // PGlite creates its own folder but not the parents: a fresh clone has no .data yet.
  mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  const client = new PGlite(LOCAL_DATA_DIR);
  return drizzlePglite(client, { schema }) as unknown as AnyDatabase;
}
