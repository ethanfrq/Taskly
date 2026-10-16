import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, jwt } from "better-auth/plugins";
import { LOCALE_COOKIE, type Locale, isLocale, negotiateLocale } from "@/i18n/config";
import type { Database } from "@/db";
import * as schema from "@/db/schema";

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
