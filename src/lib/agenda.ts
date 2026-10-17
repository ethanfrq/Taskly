import type { CalendarEvent } from "@/db/schema";
import type { TaskView } from "@/lib/tasks/service";
import { timeIn, todayIn } from "@/lib/time";

export type AgendaItem =
  | { kind: "event"; id: string; time: string | null; title: string; location: string | null }
  | { kind: "task"; task: TaskView };

/**
 * The agenda, day by day. Within a day: all-day events, then everything with
 * a time in order (an event before a task at the same minute), then the
 * untimed tasks in the user's own order.
 */
export function buildAgenda(
  events: CalendarEvent[],
  tasks: TaskView[],
  timeZone: string,
  fallbackDay: string,
): [day: string, items: AgendaItem[]][] {
  const days = new Map<string, { key: string; item: AgendaItem }[]>();
  const add = (day: string, key: string, item: AgendaItem) => {
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push({ key, item });
  };
  for (const event of events) {
    const time = event.allDay ? null : timeIn(timeZone, event.startsAt);
    add(todayIn(timeZone, event.startsAt), time ? `1 ${time} 0` : "0", {
      kind: "event",
      id: event.id,
      time,
      title: event.title,
      location: event.location,
    });
  }
  for (const task of tasks) add(task.dueDate ?? fallbackDay, task.dueTime ? `1 ${task.dueTime} 1` : "2", { kind: "task", task });

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, items]) => [day, items.sort((a, b) => a.key.localeCompare(b.key)).map(({ item }) => item)]);
}
