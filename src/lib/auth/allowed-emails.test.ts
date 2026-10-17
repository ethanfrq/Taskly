import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { allowedEmailsFromEnv, createAuth } from "./config";

let sent: string[];
let auth: ReturnType<typeof createAuth>;

const askForCode = (email: string) =>
  auth.handler(
    new Request("http://localhost:3000/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
      body: JSON.stringify({ email, type: "sign-in" }),
    }),
  );

beforeEach(async () => {
  sent = [];
  auth = createAuth({
    db: await createTestDb(),
    baseURL: "http://localhost:3000",
    secret: "test-secret-test-secret-test-secret",
    sendSignInCode: async (email) => void sent.push(email),
    nextjs: false,
    // Limits off: the allow list must hold on its own, in development too.
    rateLimit: false,
    allowedEmails: allowedEmailsFromEnv(" Ethan@Example.com , other@example.com "),
  });
});

describe("a private instance (TASKLY_ALLOWED_EMAILS)", () => {
  it("sends codes to the listed addresses, whatever the case", async () => {
    expect((await askForCode("ethan@example.com")).status).toBe(200);
    expect((await askForCode("OTHER@example.com")).status).toBe(200);
    expect(sent).toEqual(["ethan@example.com", "other@example.com"]);
  });

  it("refuses anyone else before a code exists, so no account can be created", async () => {
    const refused = await askForCode("stranger@example.com");
    expect(refused.status).toBe(403);
    expect((await refused.json()).code).toBe("EMAIL_NOT_ALLOWED");
    expect(sent).toEqual([]);
  });
});

describe("allowedEmailsFromEnv", () => {
  it("is open when unset or empty", () => {
    expect(allowedEmailsFromEnv(undefined)).toEqual([]);
    expect(allowedEmailsFromEnv(" , ")).toEqual([]);
  });
});
