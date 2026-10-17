import type { Metadata } from "next";
import { longDate } from "@/lib/date-label";
import { getLatestImport, getLists, getTodayTasks } from "@/lib/tasks/service";
import { getEventsBetween } from "@/lib/events/service";
import { getLatestRefresh } from "@/lib/tasks/refresh";
import { addDays, startOfDayUtc, timeIn } from "@/lib/time";
import { getAppContext } from "../context";
import { TodayView } from "./today-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.today.title} · Taskly` };
}

export default async function TodayPage() {
  const { db, user, prefs, locale, today, startOfToday } = await getAppContext();
  const [sections, latestImport, latestRefresh, lists, events] = await Promise.all([
    getTodayTasks(db, user.id, today, startOfToday),
    getLatestImport(db, user.id, startOfToday),
    getLatestRefresh(db, user.id, startOfToday),
    getLists(db, user.id),
    getEventsBetween(db, user.id, new Date(), startOfDayUtc(addDays(today, 1), prefs.timeZone)),
  ]);
  const tasks = [...sections.overdue, ...sections.today, ...sections.done];
  const now = timeIn(prefs.timeZone);
  // The next thing on the clock: a timed task or a calendar event, whichever comes first.
  const candidates = [
    ...sections.today.filter((task) => task.dueTime && task.dueTime >= now).map((task) => ({ time: task.dueTime!, title: task.title })),
    ...events.filter((e) => !e.allDay).map((e) => ({ time: timeIn(prefs.timeZone, e.startsAt), title: e.title })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <TodayView
      tasks={tasks}
      today={today}
      dateLabel={longDate(today, locale)}
      next={candidates[0] ?? null}
      latestImport={latestImport}
      latestRefresh={latestRefresh}
      listNames={lists.map((l) => l.name)}
    />
  );
}
