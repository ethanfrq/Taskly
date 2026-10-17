import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { user } from "@/db/schema";
import { createTestDb } from "./db";

const sam = { id: "sam", name: "Sam", email: "sam@example.com" };

describe("createTestDb", () => {
  let fromLastTest: Database | undefined;

  it("gives every call its own migrated database", async () => {
    const a = await createTestDb();
    const b = await createTestDb();
    await a.insert(user).values(sam);
    expect(await a.select().from(user)).toHaveLength(1);
    expect(await b.select().from(user)).toHaveLength(0);

    const applied = (await b.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`)) as unknown as {
      rows: { n: number }[];
    };
    expect(applied.rows[0].n).toBeGreaterThanOrEqual(10);
    fromLastTest = a;
    // Creating databases is setup work: same allowance as a hook (vitest.config.mts).
  }, 30_000);

  it("closes a test's database once the test is over", async () => {
    expect(fromLastTest).toBeDefined();
    await expect(fromLastTest!.select().from(user)).rejects.toThrow();
  });
});

describe("a database created in beforeAll", () => {
  let shared: Database;
  beforeAll(async () => {
    shared = await createTestDb();
  });

  it("is written by one test", async () => {
    await shared.insert(user).values(sam);
  });

  it("and still open for the next one", async () => {
    expect(await shared.select().from(user)).toHaveLength(1);
  });
});
