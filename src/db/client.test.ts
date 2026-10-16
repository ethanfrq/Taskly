import { afterEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "./client";

afterEach(() => vi.unstubAllEnvs());

describe("createDatabase", () => {
  it("refuses the local database on Vercel, where it wouldn't persist", () => {
    vi.stubEnv("VERCEL", "1");
    expect(() => createDatabase(undefined)).toThrow(/DATABASE_URL is missing/);
    expect(() => createDatabase("file:./somewhere")).toThrow(/DATABASE_URL is missing/);
  });

  it("still opens an in-memory database for tests on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    expect(() => createDatabase("memory://")).not.toThrow();
  });
});
