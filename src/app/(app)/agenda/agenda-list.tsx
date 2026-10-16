"use client";

import { IconCalendarEvent } from "@tabler/icons-react";
import { useOptimistic, useTransition } from "react";
import { TaskRow } from "@/components/tasks/task-row";
import { GroupList } from "@/components/ui/group";
import type { AgendaItem } from "@/lib/agenda";
import { toggleTaskAction } from "../actions";

/** One day of the agenda: events and tasks in time order; checked tasks leave the list. */
export function AgendaList({ items, today }: { items: AgendaItem[]; today: string }) {
  const [, startTransition] = useTransition();
  const [optimistic, hide] = useOptimistic(items, (state, id: string) =>
    state.filter((item) => item.kind === "event" || item.task.id !== id),
  );
  return (
    <GroupList>
      {optimistic.map((item) =>
        item.kind === "event" ? (
          <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-12 shrink-0 text-[14px] font-semibold text-accent-text tabular-nums">{item.time ?? "—"}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px]">{item.title}</span>
              {item.location ? <span className="block truncate text-[13px] text-text-secondary">{item.location}</span> : null}
            </span>
            <IconCalendarEvent size={16} stroke={1.8} className="text-text-secondary" aria-hidden />
          </li>
        ) : (
          <TaskRow
            key={item.task.id}
            task={item.task}
            today={today}
            onToggle={(t) =>
              startTransition(async () => {
                hide(t.id);
                await toggleTaskAction(t.id, true);
              })
            }
          />
        ),
      )}
    </GroupList>
  );
}
