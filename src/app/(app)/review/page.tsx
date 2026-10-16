import type { Metadata } from "next";
import { longDate } from "@/lib/date-label";
import { getTodayTasks, getUpcomingTasks } from "@/lib/tasks/service";
import { addDays } from "@/lib/time";
import { getAppContext } from "../context";
import { ReviewView } from "./review-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.review.title} · Taskly` };
}

export default async function ReviewPage() {
  const { db, user, locale, today, startOfToday } = await getAppContext();
  const tomorrow = addDays(today, 1);
  const [sections, upcoming] = await Promise.all([
    getTodayTasks(db, user.id, today, startOfToday),
    getUpcomingTasks(db, user.id, today, tomorrow),
  ]);
  const left = [...sections.overdue, ...sections.today];
  return (
    <ReviewView
      dateLabel={longDate(today, locale)}
      done={sections.done.length}
      total={sections.done.length + left.length}
      left={left.map((task) => ({ id: task.id, title: task.title }))}
      tomorrowCount={upcoming.length}
    />
  );
}
