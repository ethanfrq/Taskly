import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

/** Where the migrated database is saved for this run (read by src/test/db.ts). */
export const DUMP_ENV = "TASKLY_TEST_DB_DUMP";

/**
 * Starts Postgres and applies the migrations once for the whole run, then
 * saves the data directory: each test loads its own copy instead of paying
 * for initdb again. Built fresh every run, so it can't go stale.
 */
export default async function setup() {
  const dir = await mkdtemp(path.join(tmpdir(), "taskly-test-db-"));
  const file = path.join(dir, "migrated.tar");
  const pg = new PGlite();
  await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
  const dump = await pg.dumpDataDir("none");
  await pg.close();
  await writeFile(file, Buffer.from(await dump.arrayBuffer()));
  // Test workers are started after this and inherit the variable.
  process.env[DUMP_ENV] = file;
  return () => rm(dir, { recursive: true, force: true });
}
