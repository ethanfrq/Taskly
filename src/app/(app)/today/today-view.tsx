"use client";

import { IconCalendarEvent, IconSparkles } from "@tabler/icons-react";
import { useOptimistic, useState, useTransition } from "react";
import { QuickAdd } from "@/components/tasks/quick-add";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";
import { TaskRow } from "@/components/tasks/task-row";
import { Group, GroupList } from "@/components/ui/group";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useI18n } from "@/i18n/client";
import { format, plural } from "@/i18n/format";
import type { ImportSummary, TaskView } from "@/lib/tasks/service";
import { toggleTaskAction, undoImportAction } from "../actions";

type Props = {
  tasks: TaskView[];
  today: string;
  dateLabel: string;
  next: { time: string; title: string } | null;
  latestImport: ImportSummary | null;
  listNames: string[];
};

export function TodayView({ tasks, today, dateLabel, next, latestImport, listNames }: Props) {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [optimistic, toggleOptimistic] = useOptimistic(tasks, (state, id: string) =>
    state.map((task) => (task.id === id ? { ...task, completedAt: task.completedAt ? null : new Date() } : task)),
  );
  const [showDone, setShowDone] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const overdue = optimistic.filter((x) => !x.completedAt && x.dueDate! < today);
  const todo = optimistic.filter((x) => !x.completedAt && x.dueDate === today);
  // Timed tasks follow the clock; the rest keep the order the user dragged them into.
  const timed = todo.filter((x) => x.dueTime);
  const anytime = todo.filter((x) => !x.dueTime);
  const done = optimistic.filter((x) => x.completedAt);
  const total = optimistic.length;

  const toggle = (task: TaskView) =>
    startTransition(async () => {
      toggleOptimistic(task.id);
      await toggleTaskAction(task.id, !task.completedAt);
    });

  const undo = (batchId: string) =>
    startTransition(async () => {
      const { removed } = await undoImportAction(batchId);
      setNotice(plural(locale, removed, t.today.importUndone));
    });

  const row = (task: TaskView, showDate = false) => (
    <TaskRow key={task.id} task={task} today={today} onToggle={toggle} showDate={showDate} />
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <p className="text-[13px] text-text-secondary">{dateLabel}</p>
        <h1 className="text-[34px] font-bold tracking-tight">{t.today.title}</h1>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3 px-4">
        <div className="flex items-center gap-3 rounded-xl bg-card p-3">
          <ProgressRing done={done.length} total={total} size={44} />
          <div>
            <p className="text-[20px] font-semibold leading-tight">
              {done.length}/{total}
            </p>
            <p className="text-[13px] text-text-secondary">{t.today.doneTile}</p>
          </div>
        </div>
        <div className="min-w-0 rounded-xl bg-card p-3">
          <p className="flex items-center gap-1 text-[13px] font-medium text-accent-text">
            <IconCalendarEvent size={15} stroke={1.8} aria-hidden />
            {t.today.nextTile}
          </p>
          {next ? (
            <>
              <p className="mt-0.5 text-[20px] font-semibold leading-tight">{next.time}</p>
              <p className="truncate text-[13px] text-text-secondary">{next.title}</p>
            </>
          ) : (
            <p className="mt-1 text-[15px] text-text-secondary">{t.today.nothingNext}</p>
          )}
        </div>
      </div>

      {latestImport && !notice ? (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-3 py-2.5 text-[14px]">
          <IconSparkles size={18} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
          <span className="flex-1">
            {format(plural(locale, latestImport.count, t.today.importBanner), {
              sources: latestImport.kinds.map((k) => t.task.sources[k]).join(", ") || "Claude",
            })}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => undo(latestImport.batchId)}
            className="font-medium text-accent-text"
          >
            {t.today.importUndo}
          </button>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="mx-4 mt-3 rounded-xl bg-card px-3 py-2.5 text-[14px] text-text-secondary">
          {notice}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-5 px-4">
        {overdue.length > 0 ? (
          <Group title={<span className="text-[#FF3B30]">{t.today.overdue}</span>}>
            <GroupList>{overdue.map((task) => row(task, true))}</GroupList>
          </Group>
        ) : null}

        {todo.length > 0 ? (
          <Group title={t.today.todo}>
            {timed.length > 0 ? <GroupList>{timed.map((task) => row(task))}</GroupList> : null}
            {timed.length > 0 && anytime.length > 0 ? <div className="h-px bg-separator" /> : null}
            {anytime.length > 0 ? <SortableTaskList tasks={anytime} today={today} onToggle={toggle} /> : null}
          </Group>
        ) : total === 0 ? (
          <div className="rounded-xl bg-card px-5 py-8 text-center">
            <p className="text-[17px] font-semibold">{t.today.emptyTitle}</p>
            <p className="mt-1 text-[15px] text-text-secondary">{t.today.emptyBody}</p>
          </div>
        ) : overdue.length === 0 ? (
          <div className="rounded-xl bg-card px-5 py-8 text-center">
            <p className="text-[17px] font-semibold">{t.today.allDoneTitle}</p>
            <p className="mt-1 text-[15px] text-text-secondary">{t.today.allDoneBody}</p>
          </div>
        ) : null}

        {done.length > 0 ? (
          <div>
            <button
              type="button"
              aria-expanded={showDone}
              onClick={() => setShowDone((v) => !v)}
              className="px-4 pb-1.5 text-[13px] text-accent-text"
            >
              {showDone ? t.today.hideDone : format(t.today.showDone, { count: done.length })}
            </button>
            {showDone ? (
              <Group>
                <GroupList>{done.map((task) => row(task))}</GroupList>
              </Group>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-auto">
        <QuickAdd dueDate={today} today={today} listNames={listNames} />
      </div>
    </div>
  );
}
