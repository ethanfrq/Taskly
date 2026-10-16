import { IconChevronRight, IconInbox, IconUsers } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Group, GroupList } from "@/components/ui/group";
import { plural } from "@/i18n/format";
import { countInbox, getLists } from "@/lib/tasks/service";
import { getAppContext } from "../context";
import { NewListForm } from "./new-list-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.lists.title} · Taskly` };
}

export default async function ListsPage() {
  const { db, user, t, locale } = await getAppContext();
  const [lists, inbox] = await Promise.all([getLists(db, user.id), countInbox(db, user.id)]);

  const row = (href: string, icon: React.ReactNode, name: string, open: number, shared = false) => (
    <li key={href}>
      <Link href={href} className="flex items-center gap-3 px-4 py-3">
        {icon}
        <span className="flex flex-1 items-center gap-1.5 text-[16px]">
          {name}
          {shared ? <IconUsers size={16} stroke={1.8} className="text-text-secondary" aria-label={t.sharing.shared} /> : null}
        </span>
        <span className="text-[15px] text-text-secondary">{plural(locale, open, t.lists.openCount)}</span>
        <IconChevronRight size={18} stroke={1.8} className="text-text-secondary" aria-hidden />
      </Link>
    </li>
  );

  return (
    <div className="flex flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="px-1 text-[34px] font-bold tracking-tight">{t.lists.title}</h1>
      <Group>
        <GroupList>
          {row(
            "/lists/inbox",
            <span className="flex size-7 items-center justify-center rounded-full bg-[#8E8E93] text-white">
              <IconInbox size={16} stroke={2} aria-hidden />
            </span>,
            t.lists.inbox,
            inbox,
          )}
          {lists.map((list) =>
            row(
              `/lists/${list.id}`,
              <span className="size-7 rounded-full" style={{ background: list.color ?? "var(--accent)" }} aria-hidden />,
              list.name,
              list.openCount,
              !list.isOwner || list.memberCount > 0,
            ),
          )}
        </GroupList>
      </Group>
      <NewListForm />
    </div>
  );
}
