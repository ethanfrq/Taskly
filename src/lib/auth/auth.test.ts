import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { createTestDb } from "@/test/db";
import { type Auth, createAuth } from "./config";
import { signInCodeEmail } from "./emails";

describe("sign-in with an email code", () => {
  const sent: { email: string; otp: string; locale: string }[] = [];
  let auth: Auth;
  let db: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    db = await createTestDb();
    auth = createAuth({
      db,
      baseURL: "http://localhost:3000",
      secret: "test-secret-test-secret-test-secret",
      sendSignInCode: async (email, otp, locale) => {
        sent.push({ email, otp, locale });
      },
      nextjs: false,
    });
  });

  it("sends a 6-digit code in the visitor's language", async () => {
    await auth.api.sendVerificationOTP({
      body: { email: "sam@example.com", type: "sign-in" },
      headers: new Headers({ "accept-language": "en-US,en;q=0.9" }),
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].otp).toMatch(/^\d{6}$/);
    expect(sent[0].locale).toBe("en");
  });

  it("creates the account on first sign-in and returns a session", async () => {
    const result = await auth.api.signInEmailOTP({
      body: { email: "sam@example.com", otp: sent[0].otp },
    });
    expect(result.user.email).toBe("sam@example.com");
    expect(result.token).toBeTruthy();

    const users = await db.select().from(schema.user).where(eq(schema.user.email, "sam@example.com"));
    expect(users).toHaveLength(1);
    expect(users[0].emailVerified).toBe(true);
  });

  it("rejects a wrong code", async () => {
    await auth.api.sendVerificationOTP({ body: { email: "kim@example.com", type: "sign-in" } });
    await expect(
      auth.api.signInEmailOTP({ body: { email: "kim@example.com", otp: "000000" } }),
    ).rejects.toThrow();
  });
});

describe("signInCodeEmail", () => {
  it("is written in French or English", () => {
    expect(signInCodeEmail("a@b.c", "123456", "fr").subject).toBe("Ton code Taskly : 123456");
    expect(signInCodeEmail("a@b.c", "123456", "en").subject).toBe("Your Taskly code: 123456");
  });
});
