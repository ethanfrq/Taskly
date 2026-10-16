"use client";

import { IconChevronLeft, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";
import { Group } from "@/components/ui/group";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { TaskView } from "@/lib/tasks/service";
import { deleteListAction, toggleTaskAction, updateListAction } from "../../actions";
import { LIST_COLORS } from "../list-colors";

type Props = {
  list: { id: string; name: string; color: string | null } | null;
  title: string;
  tasks: TaskView[];
  today: string;
  listNames: string[];
};

export function ListView({ list, title, tasks, today, listNames }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, hide] = useOptimistic(tasks, (state, id: string) => state.filter((task) => task.id !== id));

  const toggle = (task: TaskView) =>
    startTransition(async () => {
      hide(task.id);
      await toggleTaskAction(task.id, true);
    });

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/lists" className="-ml-1 flex w-fit items-center text-[17px] text-accent-text">
          <IconChevronLeft size={26} stroke={1.8} aria-hidden />
          {t.lists.title}
        </Link>
      </div>
      <header className="flex items-center gap-3 px-5 pt-2">
        {list ? <span className="size-4 rounded-full" style={{ background: list.color ?? "var(--accent)" }} aria-hidden /> : null}
        <h1 className="flex-1 text-[34px] font-bold tracking-tight">
          {title}
        </h1>
        {list ? (
          <button
            type="button"
            aria-label={t.lists.delete}
            disabled={pending}
            onClick={() => {
              if (!window.confirm(format(t.lists.deleteConfirm, { name: list.name }))) return;
              startTransition(async () => {
                await deleteListAction(list.id);
                router.push("/lists");
              });
            }}
            className="text-text-secondary"
          >
            <IconTrash size={22} stroke={1.8} aria-hidden />
          </button>
        ) : null}
      </header>

      {list ? (
        <div role="radiogroup" aria-label={t.lists.color} className="mt-3 flex flex-wrap gap-2 px-5">
          {LIST_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === list.color}
              aria-label={c}
              onClick={() => startTransition(() => updateListAction(list.id, { color: c }))}
              className="size-6 rounded-full outline-offset-2 aria-checked:outline-2 aria-checked:outline-text"
              style={{ background: c }}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-5 px-4">
        {optimistic.length > 0 ? (
          <Group>
            <SortableTaskList tasks={optimistic} today={today} onToggle={toggle} showDate />
          </Group>
        ) : (
          <p className="rounded-xl bg-card px-4 py-8 text-center text-text-secondary">{t.lists.empty}</p>
        )}
      </div>

      <div className="mt-auto">
        <QuickAdd dueDate={null} today={today} listId={list?.id ?? null} listNames={listNames} />
      </div>
    </div>
  );
}
