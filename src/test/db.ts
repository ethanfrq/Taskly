import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "@/db";
import * as schema from "@/db/schema";

/*
 * Running every migration takes about 0.5 s; cloning a migrated database
 * about 0.1 s. So each test file migrates one template, once, and every
 * createTestDb() call gets its own clone: the same isolation as a brand-new
 * database (nothing is shared between tests), a fraction of the time and CPU.
 */
let template: Promise<PGlite> | undefined;

function migratedTemplate(): Promise<PGlite> {
  template ??= (async () => {
    const pg = new PGlite();
    await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
    return pg;
  })();
  return template;
}

/** A fresh in-memory Postgres with every migration applied, isolated from every other one. */
export async function createTestDb(): Promise<Database> {
  const pg = (await (await migratedTemplate()).clone()) as PGlite;
  return drizzle(pg, { schema }) as unknown as Database;
}
