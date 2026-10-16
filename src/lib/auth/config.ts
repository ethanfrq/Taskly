import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { LOCALE_COOKIE, type Locale, isLocale, negotiateLocale } from "@/i18n/config";
import type { Database } from "@/db";
import * as schema from "@/db/schema";

export type AuthOptions = {
  db: Database;
  baseURL: string;
  secret: string;
  sendSignInCode: (email: string, otp: string, locale: Locale) => Promise<void>;
  /** Sets cookies through next/headers in Server Actions. Off in tests. */
  nextjs?: boolean;
};

/** Reads the visitor's locale from the request that asked for a code. */
function localeFromHeaders(headers: Headers | undefined): Locale {
  const cookie = headers?.get("cookie") ?? "";
  const saved = cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))?.[1];
  if (isLocale(saved)) return saved;
  return negotiateLocale(headers?.get("accept-language"));
}

/**
 * Better Auth with email codes and passkeys (docs/adr/0004).
 * Built by a factory so tests can pass an in-memory database and mailer.
 */
export function createAuth({ db, baseURL, secret, sendSignInCode, nextjs = true }: AuthOptions) {
  const url = new URL(baseURL);
  return betterAuth({
    appName: "Taskly",
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    session: {
      // An installed PWA should stay signed in: 90 days, refreshed daily.
      expiresIn: 60 * 60 * 24 * 90,
      updateAge: 60 * 60 * 24,
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 60 * 10,
        allowedAttempts: 5,
        async sendVerificationOTP({ email, otp }, ctx) {
          await sendSignInCode(email, otp, localeFromHeaders(ctx?.headers));
        },
      }),
      passkey({
        rpID: url.hostname,
        rpName: "Taskly",
        origin: url.origin,
      }),
      ...(nextjs ? [nextCookies()] : []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
