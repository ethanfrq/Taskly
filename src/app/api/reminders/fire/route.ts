import { Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { z } from "zod";
import { reminderDeps } from "@/lib/reminders/runtime";
import { fireReminder } from "@/lib/reminders/service";

/** Called by QStash at a reminder's time. Only signed QStash requests are accepted. */
export async function POST(request: Request) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    return NextResponse.json({ error: "qstash_not_configured" }, { status: 503 });
  }
  const body = await request.text();
  const signature = request.headers.get("upstash-signature") ?? "";
  const valid = await new Receiver({ currentSigningKey, nextSigningKey })
    .verify({ signature, body, url: request.url })
    .catch(() => false);
  if (!valid) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });

  const parsed = z.object({ reminderId: z.string().min(1).max(64) }).safeParse(JSON.parse(body));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const outcome = await fireReminder(reminderDeps(), parsed.data.reminderId);
  return NextResponse.json({ outcome });
}
