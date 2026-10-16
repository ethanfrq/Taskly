import { addDays, weekdayOf } from "@/lib/time";

/**
 * Recurrence rules, stored as short strings:
 * - "daily"
 * - "weekdays"           Monday to Friday
 * - "weekly"             same weekday as the task
 * - "weekly:1,3"         given weekdays (0 = Sunday … 6 = Saturday)
 * - "monthly"            same day of the month, clamped to the month's last day
 */
export type Recurrence = "daily" | "weekdays" | "weekly" | `weekly:${string}` | "monthly";

export function isRecurrence(value: string): value is Recurrence {
  return (
    value === "daily" ||
    value === "weekdays" ||
    value === "weekly" ||
    value === "monthly" ||
    /^weekly:[0-6](,[0-6])*$/.test(value)
  );
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The first occurrence strictly after `after`, for a task first due on `anchor`. */
export function nextOccurrence(rule: Recurrence, anchor: string, after: string = anchor): string {
  if (rule === "daily") return addDays(after, 1);
  if (rule === "monthly") {
    const anchorDay = Number(anchor.slice(8, 10));
    let [year, month] = after.split("-").map(Number);
    for (;;) {
      const day = Math.min(anchorDay, lastDayOfMonth(year, month));
      const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (candidate > after) return candidate;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  }
  const days =
    rule === "weekdays"
      ? [1, 2, 3, 4, 5]
      : rule === "weekly"
        ? [weekdayOf(anchor)]
        : rule.slice(7).split(",").map(Number);
  for (let i = 1; i <= 7; i++) {
    const candidate = addDays(after, i);
    if (days.includes(weekdayOf(candidate))) return candidate;
  }
  throw new Error(`Invalid recurrence rule: ${rule}`);
}
