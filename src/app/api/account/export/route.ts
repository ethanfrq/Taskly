import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { getAuth } from "@/lib/auth";
import { exportUserData } from "@/lib/privacy";

/** Downloads everything Taskly stores about the signed-in user. */
export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const data = await exportUserData(getDb(), session.user.id);
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="taskly-export-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
