import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, jwt } from "better-auth/plugins";
import { LOCALE_COOKIE, type Locale, isLocale, negotiateLocale } from "@/i18n/config";
import type { Database } from "@/db";
import * as schema from "@/db/schema";
import { allowedEmailsFromEnv } from "./allowed-emails";
import { consumeEmailCodeQuota } from "./quota";

export { allowedEmailsFromEnv };

/** OAuth scopes Claude asks for when it connects (docs/connect-claude.md). */
export const MCP_SCOPES = ["tasks:read", "tasks:write"] as const;
const OAUTH_SCOPES = ["openid", "profile", "email", "offline_access", ...MCP_SCOPES];

/** The MCP endpoint, also the OAuth resource tokens are bound to (RFC 8707). */
export const mcpResource = (baseURL: string) => `${new URL(baseURL).origin}/api/mcp`;

export type AuthOptions = {
  db: Database;
  baseURL: string;
  secret: string;
  sendSignInCode: (email: string, otp: string, locale: Locale) => Promise<void>;
  /** Sets cookies through next/headers in Server Actions. Off in tests. */
  nextjs?: boolean;
  /** Per-IP request limits. On in production; tests turn them on explicitly. */
  rateLimit?: boolean;
  /** Only these addresses may get a sign-in code (a personal instance). Empty: anyone. */
  allowedEmails?: string[];
};

/** TASKLY_TRUSTED_PROXIES: comma-separated IPs or CIDR ranges of the proxies in front of Taskly. */
function trustedProxies(): string[] | undefined {
  const list = process.env.TASKLY_TRUSTED_PROXIES?.split(",").map((p) => p.trim()).filter(Boolean);
  return list?.length ? list : undefined;
}

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
export function createAuth({
  db,
  baseURL,
  secret,
  sendSignInCode,
  nextjs = true,
  rateLimit = process.env.NODE_ENV === "production",
  allowedEmails = allowedEmailsFromEnv(),
}: AuthOptions) {
  const url = new URL(baseURL);
  return betterAuth({
    appName: "Taskly",
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    // Counters live in Postgres: in memory, each serverless instance would keep
    // its own and forget them on every cold start.
    rateLimit: {
      enabled: rateLimit,
      storage: "database",
      customRules: {
        // Each request can email a stranger: 5 per 10 minutes per IP.
        "/email-otp/send-verification-otp": { window: 10 * 60, max: 5 },
        // Open to anyone so Claude can register itself: 20 per hour per IP.
        "/oauth2/register": { window: 60 * 60, max: 20 },
      },
    },
    advanced: {
      // Behind a CDN or a chain of proxies, list them so the client IP can be
      // told apart; otherwise every visitor would share one rate-limit bucket.
      ipAddress: { trustedProxies: trustedProxies() },
    },
    hooks: {
      // Before any code is generated: the allow list of a private instance, then
      // a per-address cap on top of the per-IP limit. Checked here because errors
      // in sendVerificationOTP are swallowed.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/email-otp/send-verification-otp" || typeof ctx.body?.email !== "string") return;
        // A private instance: no code (so no account) for anyone else.
        if (allowedEmails.length && !allowedEmails.includes(ctx.body.email.trim().toLowerCase())) {
          throw APIError.fromStatus("FORBIDDEN", {
            message: "This Taskly instance is private.",
            code: "EMAIL_NOT_ALLOWED",
          });
        }
        if (!rateLimit) return;
        if (!(await consumeEmailCodeQuota(db, ctx.body.email))) {
          throw APIError.fromStatus("TOO_MANY_REQUESTS", {
            message: "Too many codes for this address. Try again later.",
            code: "TOO_MANY_CODES",
          });
        }
      }),
    },
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
      // Taskly as an OAuth 2.1 authorization server for Claude's MCP connector (ADR 0001, 0007).
      jwt(),
      mcp({
        resource: mcpResource(baseURL),
        loginPage: "/sign-in",
        consentPage: "/oauth/consent",
        scopes: OAUTH_SCOPES,
        clientRegistrationDefaultScopes: OAUTH_SCOPES,
        clientRegistrationAllowedScopes: OAUTH_SCOPES,
        // Claude registers itself: Client ID Metadata Documents (below) or Dynamic Client Registration.
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        // Accept native and localhost callbacks too (MCP Inspector, desktop clients).
        clientRegistrationDefaultApplicationType: "infer",
      }),
      cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
      ...(nextjs ? [nextCookies()] : []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
