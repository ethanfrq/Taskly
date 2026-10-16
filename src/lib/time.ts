/**
 * Calendar helpers. Days are "YYYY-MM-DD" strings and times "HH:MM" strings,
 * always in the user's own time zone, so a task due "tomorrow" stays tomorrow
 * wherever the server runs.
 */

const pad = (n: number) => String(n).padStart(2, "0");

function parts(date: Date, timeZone: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

/** Today's date in a time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const p = parts(now, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Current local time "HH:MM" in a time zone. */
export function timeIn(timeZone: string, now: Date = new Date()): string {
  const p = parts(now, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

function toUtcDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(day: string, amount: number): string {
  const date = toUtcDay(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(day: string): number {
  return toUtcDay(day).getUTCDay();
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcDay(to).getTime() - toUtcDay(from).getTime()) / 86_400_000);
}

export function isValidDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toUtcDay(value).toISOString().slice(0, 10) === value;
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * The UTC instant of a local day and time in a time zone, DST included:
 * zonedToUtc("2026-03-29", "09:00", "Europe/Paris") → 07:00Z.
 */
export function zonedToUtc(day: string, time: string, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wanted = Date.UTC(y, m - 1, d, hh, mm);
  // Start from the naive guess and correct by the zone's offset at that instant, twice for DST edges.
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(guess), timeZone);
    const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wanted - seen;
  }
  return new Date(guess);
}

/** Start of a local day as a UTC instant. */
export function startOfDayUtc(day: string, timeZone: string): Date {
  return zonedToUtc(day, "00:00", timeZone);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
