import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reminderDeps } from "@/lib/reminders/runtime";
import { fireDueReminders } from "@/lib/reminders/service";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Sends every due reminder. For hosts without QStash: call it every minute
 * from a cron with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends it).
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await fireDueReminders(reminderDeps()));
}
