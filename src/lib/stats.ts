import { and, eq, gte, isNotNull } from "drizzle-orm";
import type { Database } from "@/db";
import { focusSessions, lists, tasks } from "@/db/schema";
import { addDays, startOfDayUtc, todayIn } from "@/lib/time";

export type DayStats = { day: string; done: number; focusMinutes: number };

export type WeeklyStats = {
  days: DayStats[];
  done: number;
  focusMinutes: number;
  /** Consecutive days, ending today or yesterday, with at least one task done. */
  streak: number;
  /** Share of tasks due this week that were checked. */
  completionRate: number | null;
  fromClaude: number;
  bestDay: string | null;
  topLists: { name: string; color: string | null; done: number }[];
};

/** The last 7 days (today included), in the user's time zone. */
export async function getWeeklyStats(db: Database, userId: string, timeZone: string, now = new Date()): Promise<WeeklyStats> {
  const today = todayIn(timeZone, now);
  const first = addDays(today, -6);
  // Look back further for the streak.
  const streakStart = startOfDayUtc(addDays(today, -60), timeZone);

  const [doneRows, dueRows, focusRows, listRows] = await Promise.all([
    db
      .select({ completedAt: tasks.completedAt, source: tasks.source, listId: tasks.listId })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), isNotNull(tasks.completedAt), gte(tasks.completedAt, streakStart))),
    db
      .select({ dueDate: tasks.dueDate, completedAt: tasks.completedAt })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), gte(tasks.dueDate, first))),
    db
      .select({ minutes: focusSessions.minutes, endedAt: focusSessions.endedAt })
      .from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), gte(focusSessions.endedAt, startOfDayUtc(first, timeZone)))),
    db.select({ id: lists.id, name: lists.name, color: lists.color }).from(lists).where(eq(lists.ownerId, userId)),
  ]);

  const dayOf = (date: Date) => todayIn(timeZone, date);
  const days: DayStats[] = Array.from({ length: 7 }, (_, i) => ({ day: addDays(first, i), done: 0, focusMinutes: 0 }));
  const byDay = new Map(days.map((d) => [d.day, d]));
  const doneDays = new Set<string>();
  const perList = new Map<string, number>();
  let fromClaude = 0;

  for (const row of doneRows) {
    const day = dayOf(row.completedAt!);
    doneDays.add(day);
    const bucket = byDay.get(day);
    if (!bucket) continue;
    bucket.done++;
    if (row.source === "claude") fromClaude++;
    if (row.listId) perList.set(row.listId, (perList.get(row.listId) ?? 0) + 1);
  }
  for (const row of focusRows) {
    const bucket = byDay.get(dayOf(row.endedAt));
    if (bucket) bucket.focusMinutes += row.minutes;
  }

  let streak = 0;
  let cursor = doneDays.has(today) ? today : addDays(today, -1);
  while (doneDays.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const dueThisWeek = dueRows.filter((r) => r.dueDate! <= today);
  const best = days.reduce<DayStats | null>((top, d) => (d.done > (top?.done ?? 0) ? d : top), null);

  return {
    days,
    done: days.reduce((sum, d) => sum + d.done, 0),
    focusMinutes: days.reduce((sum, d) => sum + d.focusMinutes, 0),
    streak,
    completionRate: dueThisWeek.length ? dueThisWeek.filter((r) => r.completedAt).length / dueThisWeek.length : null,
    fromClaude,
    bestDay: best?.day ?? null,
    topLists: listRows
      .map((l) => ({ name: l.name, color: l.color, done: perList.get(l.id) ?? 0 }))
      .filter((l) => l.done > 0)
      .sort((a, b) => b.done - a.done)
      .slice(0, 3),
  };
}

export async function recordFocusSession(db: Database, userId: string, minutes: number, taskId: string | null) {
  await db.insert(focusSessions).values({ id: crypto.randomUUID(), userId, minutes, taskId });
}
