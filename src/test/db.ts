import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { TestRunner, afterAll, afterEach } from "vitest";
import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { DUMP_ENV } from "./global-setup";

/*
 * Each test gets its own in-memory Postgres, loaded from the database the
 * global setup migrated once for the run (src/test/global-setup.ts): about
 * 0.1 s, against 0.5 s to start and migrate a template in every test file.
 * Every database is closed when its test is done (or its file, if created in
 * beforeAll), so a worker doesn't keep every instance it ever opened.
 */

let migrated: Promise<Blob> | undefined;

function migratedDataDir(): Promise<Blob> {
  migrated ??= (async () => {
    const file = process.env[DUMP_ENV];
    if (file) return new Blob([await readFile(file)]);
    // Without the global setup (a tool running one file directly): migrate here.
    const pg = new PGlite();
    await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
    const dump = await pg.dumpDataDir("none");
    await pg.close();
    return dump;
  })();
  return migrated;
}

const perTest: PGlite[] = [];
const perFile: PGlite[] = [];

afterEach(async () => {
  await Promise.all(perTest.splice(0).map((pg) => pg.close()));
});

afterAll(async () => {
  await Promise.all(perFile.splice(0).map((pg) => pg.close()));
});

/** A fresh in-memory Postgres with every migration applied. */
export async function createTestDb(): Promise<Database> {
  const pg = new PGlite({ loadDataDir: await migratedDataDir() });
  await pg.waitReady;
  // Created in a test or its beforeEach: closed after the test. In beforeAll: after the file.
  (TestRunner.getCurrentTest() ? perTest : perFile).push(pg);
  return drizzle(pg, { schema }) as unknown as Database;
}
