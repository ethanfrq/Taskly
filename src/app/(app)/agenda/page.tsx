import type { Metadata } from "next";
import { Group } from "@/components/ui/group";
import { dayLabel } from "@/lib/date-label";
import { buildAgenda } from "@/lib/agenda";
import { getEventsBetween } from "@/lib/events/service";
import { getTodayTasks, getUpcomingTasks } from "@/lib/tasks/service";
import { addDays, startOfDayUtc } from "@/lib/time";
import { getAppContext } from "../context";
import { AgendaList } from "./agenda-list";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.agenda.title} · Taskly` };
}

const DAYS = 14;

/** Today and the next two weeks: calendar events (from Claude) and dated tasks, day by day. */
export default async function AgendaPage() {
  const { db, user, prefs, t, locale, today, startOfToday } = await getAppContext();
  const until = addDays(today, DAYS);
  const [todayTasks, upcoming, events] = await Promise.all([
    getTodayTasks(db, user.id, today, startOfToday),
    getUpcomingTasks(db, user.id, today, until),
    getEventsBetween(db, user.id, startOfToday, startOfDayUtc(addDays(until, 1), prefs.timeZone)),
  ]);

  // Today's section holds the open tasks for today (overdue ones live on Today).
  const agenda = buildAgenda(events, [...todayTasks.today, ...upcoming], prefs.timeZone, today);

  return (
    <div className="flex flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
      <h1 className="px-1 text-[34px] font-bold tracking-tight">{t.agenda.title}</h1>
      {agenda.map(([day, items]) => (
        <Group key={day} title={dayLabel(day, today, locale, t)}>
          <AgendaList items={items} today={today} />
        </Group>
      ))}
      {agenda.length === 0 ? (
        <p className="rounded-xl bg-card px-4 py-8 text-center text-text-secondary">{t.agenda.empty}</p>
      ) : null}
    </div>
  );
}
