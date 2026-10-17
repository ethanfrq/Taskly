import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { authorizedCron } from "@/lib/cron";
import { cleanupDatabase } from "@/lib/housekeeping";

/**
 * Deletes the bookkeeping rows nothing reads any more (src/lib/housekeeping.ts)
 * and returns how many went. Called once a day by Vercel Cron (vercel.json)
 * or any cron, with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  if (!authorizedCron(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await cleanupDatabase(getDb()));
}
