"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { TaskView } from "@/lib/tasks/service";

/** How long a ticked task stays in place before it leaves the list. */
export const SETTLE_MS = 600;

/**
 * Ticking a task shows the tick first and moves the task away a moment later,
 * as in Reminders: the user sees their tap land, and a second tap in that
 * moment cancels it. Reopening a done task is immediate.
 */
export function useSettledToggle(commit: (task: TaskView) => void) {
  const [settling, setSettling] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const without = (id: string) => (set: ReadonlySet<string>) => new Set([...set].filter((x) => x !== id));

  const toggle = useCallback(
    (task: TaskView) => {
      const timer = timers.current.get(task.id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(task.id);
        setSettling(without(task.id));
        return;
      }
      if (task.completedAt) return commit(task);
      navigator.vibrate?.(10);
      setSettling((set) => new Set(set).add(task.id));
      timers.current.set(
        task.id,
        setTimeout(() => {
          timers.current.delete(task.id);
          // One transition for both, so the row never flashes back to unticked before it leaves.
          startTransition(() => {
            setSettling(without(task.id));
            commit(task);
          });
        }, SETTLE_MS),
      );
    },
    [commit],
  );

  /** The task as it should look right now: ticked while it settles. */
  const shown = useCallback(
    (task: TaskView): TaskView => (settling.has(task.id) ? { ...task, completedAt: new Date() } : task),
    [settling],
  );

  return { toggle, shown };
}
