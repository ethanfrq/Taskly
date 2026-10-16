import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotFoundError, getListTasks, getLists, getParticipants } from "@/lib/tasks/service";
import { getBaseUrl } from "@/lib/url";
import { getAppContext } from "../../context";
import { ListView } from "./list-view";

export async function generateMetadata({ params }: PageProps<"/lists/[id]">): Promise<Metadata> {
  const { db, user, t } = await getAppContext();
  const { id } = await params;
  if (id === "inbox") return { title: `${t.lists.inbox} · Taskly` };
  const list = (await getLists(db, user.id)).find((l) => l.id === id);
  return { title: `${list?.name ?? t.lists.title} · Taskly` };
}

export default async function ListPage({ params }: PageProps<"/lists/[id]">) {
  const { db, user, t, today } = await getAppContext();
  const { id } = await params;
  const inbox = id === "inbox";
  const allLists = await getLists(db, user.id);
  const list = inbox ? null : allLists.find((l) => l.id === id);
  if (!inbox && !list) notFound();
  const [tasks, participants] = await Promise.all([
    getListTasks(db, user.id, inbox ? null : id),
    inbox ? Promise.resolve([]) : getParticipants(db, user.id, id),
  ]).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  return (
    <ListView
      list={list ? { id: list.id, name: list.name, color: list.color } : null}
      sharing={
        list
          ? { isOwner: list.isOwner, inviteToken: list.isOwner ? list.inviteToken : null, participants, meId: user.id, origin: getBaseUrl() }
          : null
      }
      title={list?.name ?? t.lists.inbox}
      tasks={tasks}
      today={today}
      listNames={allLists.map((l) => l.name)}
    />
  );
}
