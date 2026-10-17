import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { rateLimit } from "@/db/schema";
import { createTestDb } from "@/test/db";
import { createAuth } from "./config";
import { EMAIL_CODE_QUOTA, consumeEmailCodeQuota } from "./quota";

let db: Database;
let sent: string[];

const instance = () =>
  createAuth({
    db,
    baseURL: "http://localhost:3000",
    secret: "test-secret-test-secret-test-secret",
    sendSignInCode: async (email) => void sent.push(email),
    nextjs: false,
    rateLimit: true,
  });

/** A real HTTP request, as the sign-in form sends it, from a given client IP. */
const askForCode = (auth: ReturnType<typeof instance>, email: string, ip: string) =>
  auth.handler(
    new Request("http://localhost:3000/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ email, type: "sign-in" }),
    }),
  );

beforeEach(async () => {
  db = await createTestDb();
  sent = [];
});

afterEach(() => vi.unstubAllEnvs());

describe("per-IP limits stored in the database", () => {
  it("stops a sixth code request from one IP within ten minutes", async () => {
    const auth = instance();
    for (let i = 0; i < 5; i++) expect((await askForCode(auth, `user${i}@example.com`, "203.0.113.7")).status).toBe(200);
    const blocked = await askForCode(auth, "user5@example.com", "203.0.113.7");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("X-Retry-After"))).toBeGreaterThan(0);
    expect(sent).toHaveLength(5);
    // Another visitor isn't affected.
    expect((await askForCode(auth, "other@example.com", "198.51.100.4")).status).toBe(200);
  });

  it("holds across instances, unlike an in-memory counter", async () => {
    for (let i = 0; i < 5; i++) await askForCode(instance(), `user${i}@example.com`, "203.0.113.7");
    expect((await askForCode(instance(), "user5@example.com", "203.0.113.7")).status).toBe(429);
    const [row] = await db.select().from(rateLimit).where(eq(rateLimit.key, "203.0.113.7|/email-otp/send-verification-otp"));
    expect(row.count).toBe(5);
  });
});

describe("behind a chain of proxies", () => {
  const viaProxy = (auth: ReturnType<typeof instance>, email: string, client: string) =>
    askForCode(auth, email, `${client}, 10.0.0.5`);

  it("shares one bucket between all visitors unless the proxies are declared", async () => {
    const auth = instance();
    for (let i = 0; i < 5; i++) await viaProxy(auth, `user${i}@example.com`, `203.0.113.${i + 1}`);
    expect((await viaProxy(auth, "next@example.com", "198.51.100.4")).status).toBe(429);
  });

  it("tells visitors apart with TASKLY_TRUSTED_PROXIES", async () => {
    vi.stubEnv("TASKLY_TRUSTED_PROXIES", "10.0.0.0/8");
    const auth = instance();
    for (let i = 0; i < 5; i++) await viaProxy(auth, `user${i}@example.com`, "203.0.113.7");
    expect((await viaProxy(auth, "user5@example.com", "203.0.113.7")).status).toBe(429);
    expect((await viaProxy(auth, "next@example.com", "198.51.100.4")).status).toBe(200);
  });
});

describe("per-address cap on sign-in codes", () => {
  it("refuses a sixth code for one inbox, even from different IPs", async () => {
    const auth = instance();
    for (let i = 0; i < 5; i++) expect((await askForCode(auth, "victim@example.com", `203.0.113.${i + 1}`)).status).toBe(200);
    const blocked = await askForCode(auth, "Victim@Example.com", "203.0.113.99");
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).code).toBe("TOO_MANY_CODES");
    expect(sent).toHaveLength(5);
    expect((await askForCode(auth, "someone-else@example.com", "203.0.113.99")).status).toBe(200);
  });

  it("opens again once the hour has passed, and never stores the address", async () => {
    const start = Date.UTC(2026, 9, 17, 8);
    for (let i = 0; i < EMAIL_CODE_QUOTA.max; i++) expect(await consumeEmailCodeQuota(db, "sam@example.com", start)).toBe(true);
    expect(await consumeEmailCodeQuota(db, "sam@example.com", start + 1000)).toBe(false);
    expect(await consumeEmailCodeQuota(db, "sam@example.com", start + EMAIL_CODE_QUOTA.windowMs)).toBe(true);

    const rows = await db.select().from(rateLimit);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toMatch(/^email-code\|[0-9a-f]{64}$/);
    expect(JSON.stringify(rows)).not.toContain("sam@");
  });
});
