// Applies the SQL migrations in ./drizzle.
// DATABASE_URL set (postgres://…) → that database. Unset → the local PGlite database in .data/pglite.
import { mkdirSync } from "node:fs";

const url = process.env.DATABASE_URL;
const migrationsFolder = "./drizzle";
const postgres = !!url && /^postgres(ql)?:\/\//.test(url);

// On Vercel a local database would be lost after the build: fail the deploy
// with a clear message instead of shipping an app that can't sign anyone in.
if (process.env.VERCEL && !postgres) {
  console.error(
    "✗ DATABASE_URL is missing or isn't a postgres:// URL.\n" +
      "  Add a Neon Postgres database from the Vercel Marketplace (Storage tab), then redeploy.\n" +
      "  See docs/self-hosting.md.",
  );
  process.exit(1);
}

if (postgres) {
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
