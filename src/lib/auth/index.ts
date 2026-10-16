import "server-only";
import { getDb } from "@/db";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { type Auth, createAuth } from "./config";
import { signInCodeEmail } from "./emails";

const DEV_SECRET = "taskly-local-development-secret-do-not-use-in-production";

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production" && !process.env.TASKLY_ALLOW_DEV_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is missing. Generate one with: openssl rand -base64 32");
  }
  return DEV_SECRET;
}

const globalForAuth = globalThis as unknown as { taskly_auth?: Auth };

/** The Better Auth instance, created on first use. */
export function getAuth(): Auth {
  globalForAuth.taskly_auth ??= createAuth({
    db: getDb(),
    baseURL: getBaseUrl(),
    secret: getSecret(),
    sendSignInCode: (email, otp, locale) => sendEmail(signInCodeEmail(email, otp, locale)),
  });
  return globalForAuth.taskly_auth;
}
