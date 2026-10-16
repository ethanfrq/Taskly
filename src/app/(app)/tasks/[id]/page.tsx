import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotFoundError, getLists, getTask } from "@/lib/tasks/service";
import { getAppContext } from "../../context";
import { TaskEditor } from "./task-editor";

export async function generateMetadata({ params }: PageProps<"/tasks/[id]">): Promise<Metadata> {
  const { db, user } = await getAppContext();
  try {
    const task = await getTask(db, user.id, (await params).id);
    return { title: `${task.title} · Taskly` };
  } catch {
    return { title: "Taskly" };
  }
}

export default async function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  const { db, user, today } = await getAppContext();
  const { id } = await params;
  const data = await Promise.all([getTask(db, user.id, id), getLists(db, user.id)]).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [task, lists] = data;
  return <TaskEditor task={task} lists={lists.map(({ id, name, color }) => ({ id, name, color }))} today={today} />;
}
