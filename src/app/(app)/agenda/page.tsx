import { IconCalendarEvent } from "@tabler/icons-react";
import type { Metadata } from "next";
import { Group } from "@/components/ui/group";
import { dayLabel } from "@/lib/date-label";
import { getEventsBetween } from "@/lib/events/service";
import { getTodayTasks, getUpcomingTasks } from "@/lib/tasks/service";
import { addDays, startOfDayUtc, timeIn, todayIn } from "@/lib/time";
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

  const days = new Map<string, { tasks: typeof upcoming; events: typeof events }>();
  const bucket = (day: string) => {
    if (!days.has(day)) days.set(day, { tasks: [], events: [] });
    return days.get(day)!;
  };
  bucket(today).tasks.push(...todayTasks.today);
  for (const task of upcoming) bucket(task.dueDate!).tasks.push(task);
  for (const event of events) bucket(todayIn(prefs.timeZone, event.startsAt)).events.push(event);
  const ordered = [...days.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
      <h1 className="px-1 text-[34px] font-bold tracking-tight">{t.agenda.title}</h1>
      {ordered.map(([day, { tasks, events: dayEvents }]) =>
        tasks.length + dayEvents.length > 0 ? (
          <Group key={day} title={dayLabel(day, today, locale, t)}>
            {dayEvents.length > 0 ? (
              <ul className="divide-y divide-separator">
                {dayEvents.map((event) => (
                  <li key={event.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-12 shrink-0 text-[14px] font-semibold text-accent-text tabular-nums">
                      {event.allDay ? "—" : timeIn(prefs.timeZone, event.startsAt)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px]">{event.title}</span>
                      {event.location ? <span className="block truncate text-[13px] text-text-secondary">{event.location}</span> : null}
                    </span>
                    <IconCalendarEvent size={16} stroke={1.8} className="text-text-secondary" aria-hidden />
                  </li>
                ))}
              </ul>
            ) : null}
            {dayEvents.length > 0 && tasks.length > 0 ? <div className="h-px bg-separator" /> : null}
            {tasks.length > 0 ? <AgendaList tasks={tasks} today={today} /> : null}
          </Group>
        ) : null,
      )}
      {ordered.every(([, d]) => d.tasks.length + d.events.length === 0) ? (
        <p className="rounded-xl bg-card px-4 py-8 text-center text-text-secondary">{t.agenda.empty}</p>
      ) : null}
    </div>
  );
}
