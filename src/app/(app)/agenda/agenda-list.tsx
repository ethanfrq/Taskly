"use client";

import { useOptimistic, useTransition } from "react";
import { TaskRow } from "@/components/tasks/task-row";
import { GroupList } from "@/components/ui/group";
import type { TaskView } from "@/lib/tasks/service";
import { toggleTaskAction } from "../actions";

export function AgendaList({ tasks, today }: { tasks: TaskView[]; today: string }) {
  const [, startTransition] = useTransition();
  const [optimistic, hide] = useOptimistic(tasks, (state, id: string) => state.filter((task) => task.id !== id));
  return (
    <GroupList>
      {optimistic.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          today={today}
          onToggle={(t) =>
            startTransition(async () => {
              hide(t.id);
              await toggleTaskAction(t.id, true);
            })
          }
        />
      ))}
    </GroupList>
  );
}
