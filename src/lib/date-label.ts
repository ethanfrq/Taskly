import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import { daysBetween } from "./time";

/** "Aujourd'hui", "Demain", "lundi", "ven. 23 oct." relative to today. */
export function dayLabel(day: string, today: string, locale: Locale, t: Dictionary): string {
  const diff = daysBetween(today, day);
  if (diff === 0) return t.days.today;
  if (diff === 1) return t.days.tomorrow;
  if (diff === -1) return t.days.yesterday;
  const date = new Date(`${day}T12:00:00Z`);
  if (diff > 1 && diff < 7) {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(date);
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

/** "Vendredi 16 octobre" for page headers. */
export function longDate(day: string, locale: Locale): string {
  const text = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
