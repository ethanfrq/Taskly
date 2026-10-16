import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { getAuth } from "@/lib/auth";
import { removeSubscription, saveSubscription } from "@/lib/push/subscriptions";
import { getVapidKeys } from "@/lib/push/vapid";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
});

async function sessionUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** The public VAPID key the browser needs to subscribe. */
export async function GET() {
  const keys = getVapidKeys();
  if (!keys) return NextResponse.json({ error: "push_not_configured" }, { status: 503 });
  return NextResponse.json({ publicKey: keys.publicKey });
}

/** Saves this device's subscription. */
export async function POST(request: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  await saveSubscription(getDb(), user.id, parsed.data, request.headers.get("user-agent"));
  return NextResponse.json({ ok: true });
}

/** Forgets this device. */
export async function DELETE(request: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ endpoint: z.url() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await removeSubscription(getDb(), user.id, parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
