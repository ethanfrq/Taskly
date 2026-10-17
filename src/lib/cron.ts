import { timingSafeEqual } from "node:crypto";

/**
 * Whether a request comes from the cron: `Authorization: Bearer $CRON_SECRET`,
 * as Vercel Cron sends it. Compared in constant time. Without a secret
 * configured, nothing is authorized: the endpoints fail closed.
 */
export function authorizedCron(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
