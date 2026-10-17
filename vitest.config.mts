import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Migrates one database for the whole run; tests load copies of it (src/test/db.ts).
    globalSetup: ["./src/test/global-setup.ts"],
    // Backstop for overloaded machines: the first database in each worker compiles
    // PGlite's WebAssembly, quick alone but over 10 s when the CPU is several times
    // oversubscribed. A real hang still fails, later.
    hookTimeout: 30_000,
  },
});
