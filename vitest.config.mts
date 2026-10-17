import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Backstop for overloaded machines: a file's first hook migrates the test
    // database template (src/test/db.ts), about 0.5 s alone but over 10 s when
    // the CPU is several times oversubscribed. A real hang still fails, later.
    hookTimeout: 30_000,
  },
});
