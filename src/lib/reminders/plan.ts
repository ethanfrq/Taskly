import { addDays, timeIn, todayIn, zonedToUtc } from "@/lib/time";

/** Minutes between follow-ups (D-007). */
export const FOLLOW_UP_MINUTES = 15;
/** Level 4 follows up "until checked", capped so a forgotten task can't buzz all night. */
export const MAX_FOLLOW_UPS = 16;

/** How many follow-ups a task gets after its first reminder. */
export function followUpCount(insistence: number, priority: number, priorityOnly: boolean): number {
  if (priorityOnly && priority === 0) return 0;
  switch (insistence) {
    case 1:
      return 0;
    case 2:
      return 1;
    case 3:
      return 2;
    default:
      return MAX_FOLLOW_UPS;
  }
}

/** The instant a timed task should first remind, or null when it has no time. */
export function taskReminderAt(dueDate: string | null, dueTime: string | null, timeZone: string): Date | null {
  if (!dueDate || !dueTime) return null;
  return zonedToUtc(dueDate, dueTime, timeZone);
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Whether a local time falls in the quiet window, which may wrap past midnight. */
export function inQuietHours(local: string, start: string, end: string): boolean {
  if (start === end) return false;
  const [t, s, e] = [minutes(local), minutes(start), minutes(end)];
  return s < e ? t >= s && t < e : t >= s || t < e;
}

/**
 * Moves an instant out of quiet hours: a reminder at 23:10 with quiet hours
 * 21:00–07:00 is sent at 07:00 the next morning.
 */
export function afterQuietHours(at: Date, timeZone: string, start: string, end: string): Date {
  const local = timeIn(timeZone, at);
  if (!inQuietHours(local, start, end)) return at;
  const today = todayIn(timeZone, at);
  const day = minutes(local) >= minutes(end) ? addDays(today, 1) : today;
  return zonedToUtc(day, end, timeZone);
}

/** The next instant a daily local time happens, strictly after `now`. */
export function nextDailyAt(time: string, timeZone: string, now: Date): Date {
  const today = todayIn(timeZone, now);
  const candidate = zonedToUtc(today, time, timeZone);
  return candidate > now ? candidate : zonedToUtc(addDays(today, 1), time, timeZone);
}
