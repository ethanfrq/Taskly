import type { Metadata } from "next";
import { getTodayTasks } from "@/lib/tasks/service";
import { getAppContext } from "../context";
import { FocusTimer } from "./focus-timer";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.focus.title} · Taskly` };
}

export default async function FocusPage({ searchParams }: PageProps<"/focus">) {
  const { db, user, today, startOfToday } = await getAppContext();
  const { task } = await searchParams;
  const sections = await getTodayTasks(db, user.id, today, startOfToday);
  const open = [...sections.overdue, ...sections.today].map((x) => ({ id: x.id, title: x.title }));
  const selected = typeof task === "string" && open.some((x) => x.id === task) ? task : null;
  return <FocusTimer tasks={open} initialTaskId={selected} />;
}
