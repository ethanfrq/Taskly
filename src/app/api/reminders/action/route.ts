import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { reminders } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { FOLLOW_UP_MINUTES } from "@/lib/reminders/plan";
import { reminderDeps } from "@/lib/reminders/runtime";
import { snoozeTask, syncTaskReminders } from "@/lib/reminders/service";
import { setCompleted } from "@/lib/tasks/service";

const schema = z.object({ reminderId: z.string().min(1).max(64), action: z.enum(["done", "snooze"]) });

/** Notification buttons (Android): "Done" and "In 15 min", without opening the app. */
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const deps = reminderDeps();
  const [reminder] = await deps.db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, parsed.data.reminderId), eq(reminders.userId, session.user.id)));
  if (!reminder?.taskId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (parsed.data.action === "done") {
    await setCompleted(deps.db, session.user.id, reminder.taskId, true);
    await syncTaskReminders(deps, session.user.id, reminder.taskId);
  } else {
    await snoozeTask(deps, session.user.id, reminder.taskId, new Date(Date.now() + FOLLOW_UP_MINUTES * 60_000));
  }
  return NextResponse.json({ ok: true });
}
