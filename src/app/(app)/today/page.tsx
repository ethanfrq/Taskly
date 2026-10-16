import type { Metadata } from "next";
import { longDate } from "@/lib/date-label";
import { getLatestImport, getTodayTasks } from "@/lib/tasks/service";
import { timeIn } from "@/lib/time";
import { getAppContext } from "../context";
import { TodayView } from "./today-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.today.title} · Taskly` };
}

export default async function TodayPage() {
  const { db, user, prefs, locale, today, startOfToday } = await getAppContext();
  const [sections, latestImport] = await Promise.all([
    getTodayTasks(db, user.id, today, startOfToday),
    getLatestImport(db, user.id, startOfToday),
  ]);
  const tasks = [...sections.overdue, ...sections.today, ...sections.done];
  const now = timeIn(prefs.timeZone);
  const nextTask = sections.today.find((task) => task.dueTime && task.dueTime >= now);

  return (
    <TodayView
      tasks={tasks}
      today={today}
      dateLabel={longDate(today, locale)}
      next={nextTask ? { time: nextTask.dueTime!, title: nextTask.title } : null}
      latestImport={latestImport}
    />
  );
}
