"use client";

import { IconRepeat, IconSubtask } from "@tabler/icons-react";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { dayLabel } from "@/lib/date-label";
import type { TaskView } from "@/lib/tasks/service";
import { CheckCircle } from "./check-circle";
import { SourceIcon } from "./source-icon";

export function TaskRow({
  task,
  today,
  onToggle,
  showDate = false,
  itemRef,
  style,
  className = "",
  trailing,
}: {
  task: TaskView;
  today: string;
  onToggle: (task: TaskView) => void;
  showDate?: boolean;
  /** For drag and drop: the row element, its style and an extra control. */
  itemRef?: (node: HTMLLIElement | null) => void;
  style?: React.CSSProperties;
  className?: string;
  trailing?: React.ReactNode;
}) {
  const { locale, t } = useI18n();
  const done = !!task.completedAt;
  const meta: React.ReactNode[] = [];

  if (task.list) {
    meta.push(
      <span key="list" className="inline-flex items-center gap-1">
        <span className="size-2 rounded-full" style={{ background: task.list.color ?? "var(--accent)" }} />
        {task.list.name}
      </span>,
    );
  }
  if (showDate && task.dueDate) {
    meta.push(
      <span key="date" className={task.dueDate < today && !done ? "text-[#FF3B30]" : undefined}>
        {dayLabel(task.dueDate, today, locale, t)}
      </span>,
    );
  }
  if (task.dueTime) {
    meta.push(
      <span key="time" className={done ? undefined : "text-accent-text"}>
        {task.dueTime}
      </span>,
    );
  }
  if (task.sourceKind) {
    meta.push(
      <span key="source" className="inline-flex items-center gap-1">
        <SourceIcon kind={task.sourceKind} />
        {t.task.sources[task.sourceKind]}
      </span>,
    );
  }
  if (task.subtasks.total > 0) {
    meta.push(
      <span key="sub" className="inline-flex items-center gap-1">
        <IconSubtask size={13} stroke={1.8} aria-hidden />
        {format(t.task.subtasksProgress, task.subtasks)}
      </span>,
    );
  }
  if (task.recurrence) meta.push(<IconRepeat key="rec" size={13} stroke={1.8} aria-hidden />);
  for (const tag of task.tagNames) meta.push(<span key={`#${tag}`}>#{tag}</span>);

  return (
    <li ref={itemRef} style={style} className={`flex items-start gap-3 bg-card px-4 py-2.5 ${className}`}>
      <div className="pt-0.5">
        <CheckCircle
          checked={done}
          label={format(done ? t.task.reopen : t.task.complete, { title: task.title })}
          onToggle={() => onToggle(task)}
        />
      </div>
      <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1 py-0.5">
        <span className={`block text-[16px] leading-snug ${done ? "text-text-secondary line-through" : ""}`}>
          {task.title}
        </span>
        {meta.length > 0 ? (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-text-secondary">
            {meta.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                {i > 0 ? <span aria-hidden>·</span> : null}
                {item}
              </span>
            ))}
          </span>
        ) : null}
      </Link>
      {task.priority > 0 && !done ? (
        <span className="pt-1 font-semibold text-accent-text" aria-label={`${t.task.priorityLabel}: ${t.task.priority[task.priority]}`}>
          {"!".repeat(task.priority)}
        </span>
      ) : null}
      {trailing}
    </li>
  );
}
