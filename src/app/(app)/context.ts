import "server-only";
import { cache } from "react";
import { getDb } from "@/db";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/auth/session";
import { getPreferences } from "@/lib/preferences";
import { startOfDayUtc, todayIn } from "@/lib/time";

/** Everything an app page needs about the visitor, loaded once per request. */
export const getAppContext = cache(async () => {
  const user = await requireUser();
  const db = getDb();
  const prefs = await getPreferences(db, user.id);
  const { locale, t } = await getI18n();
  const today = todayIn(prefs.timeZone);
  return { user, db, prefs, locale, t, today, startOfToday: startOfDayUtc(today, prefs.timeZone) };
});
