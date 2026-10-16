/**
 * Public URL of this Taskly instance, used for auth callbacks, passkeys
 * and the MCP endpoint. BETTER_AUTH_URL wins; on Vercel the production
 * domain is used; locally http://localhost:3000.
 */
export function getBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
