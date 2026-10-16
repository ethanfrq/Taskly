import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getDictionary } from "@/i18n/server";
import { getAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { sendToUser } from "@/lib/push/send";

/** Sends a test notification to every device of the signed-in user. */
export async function POST() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const prefs = await getPreferences(db, session.user.id);
  const t = getDictionary(prefs.locale === "en" ? "en" : "fr");
  try {
    const result = await sendToUser(db, session.user.id, {
      title: t.notifications.testTitle,
      body: t.notifications.testBody,
      tag: "test",
      url: "/today",
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }
}
