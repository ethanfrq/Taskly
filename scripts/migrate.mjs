// Applies the SQL migrations in ./drizzle.
// DATABASE_URL set (postgres://…) → that database. Unset → the local PGlite database in .data/pglite.
import { mkdirSync } from "node:fs";

const url = process.env.DATABASE_URL;
const migrationsFolder = "./drizzle";

if (url && /^postgres(ql)?:\/\//.test(url)) {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const pool = new Pool({ connectionString: url, max: 1 });
  await migrate(drizzle(pool), { migrationsFolder });
  await pool.end();
  console.log("✓ Postgres migrations applied");
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  mkdirSync(".data", { recursive: true });
  const client = new PGlite(".data/pglite");
  await migrate(drizzle(client), { migrationsFolder });
  await client.close();
  console.log("✓ Local database ready (.data/pglite)");
}
