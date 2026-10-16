import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getAuth } from "@/lib/auth";
import { savePreferences } from "@/lib/preferences";

/**
 * Called by the service worker when the test notification reaches the device:
 * proof for the health check that push really works here.
 */
export async function POST() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await savePreferences(getDb(), session.user.id, { testPushReceivedAt: new Date() });
  return NextResponse.json({ ok: true });
}
