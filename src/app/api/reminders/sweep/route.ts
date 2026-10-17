import { NextResponse } from "next/server";
import { authorizedCron } from "@/lib/cron";
import { reminderDeps } from "@/lib/reminders/runtime";
import { fireDueReminders } from "@/lib/reminders/service";

/**
 * Sends every due reminder. For hosts without QStash: call it every minute
 * from a cron with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends it).
 */
export async function GET(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await fireDueReminders(reminderDeps()));
}
