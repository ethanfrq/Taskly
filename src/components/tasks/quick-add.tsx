"use client";

import { IconCalendarEvent, IconCirclePlus, IconClock, IconFlag, IconHash, IconList, IconRepeat } from "@tabler/icons-react";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import { createTaskAction } from "@/app/(app)/actions";
import { useI18n } from "@/i18n/client";
import { dayLabel } from "@/lib/date-label";
import { parseTask } from "@/lib/nlp/parse";
import { enqueue, isNetworkError } from "@/lib/offline/outbox";

type Props = {
  /** Day given to tasks that name none: today in Today, null in a list. */
  dueDate: string | null;
  today: string;
  listId?: string | null;
  listNames?: string[];
};

/** The "new task" bar pinned above the tab bar, with natural language parsing. */
export function QuickAdd({ dueDate, today, listId, listNames = [] }: Props) {
  const { locale, t } = useI18n();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(
    () => parseTask(text, { today, lists: listNames, dayFirst: locale !== "en" }),
    [text, today, listNames, locale],
  );

  const chips: { key: string; icon: React.ReactNode; label: string }[] = [];
  if (parsed.dueDate && parsed.dueDate !== dueDate) {
    chips.push({ key: "date", icon: <IconCalendarEvent size={14} aria-hidden />, label: dayLabel(parsed.dueDate, today, locale, t) });
  }
  if (parsed.dueTime) chips.push({ key: "time", icon: <IconClock size={14} aria-hidden />, label: parsed.dueTime });
  if (parsed.recurrence) {
    const kind = parsed.recurrence.startsWith("weekly:") ? "weekly" : (parsed.recurrence as keyof typeof t.task.recurrence);
    chips.push({ key: "rec", icon: <IconRepeat size={14} aria-hidden />, label: t.task.recurrence[kind] });
  }
  if (parsed.priority) chips.push({ key: "prio", icon: <IconFlag size={14} aria-hidden />, label: t.task.priority[parsed.priority] });
  if (parsed.listName) chips.push({ key: "list", icon: <IconList size={14} aria-hidden />, label: parsed.listName });
  for (const tag of parsed.tags) chips.push({ key: `#${tag}`, icon: <IconHash size={14} aria-hidden />, label: tag });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const title = parsed.title || text.trim();
    if (!title) return;
    setText("");
    const input = {
      title,
      dueDate: parsed.dueDate ?? dueDate,
      dueTime: parsed.dueTime ?? null,
      priority: parsed.priority,
      tags: parsed.tags,
      recurrence: parsed.recurrence ?? null,
      listId: parsed.listName ? null : (listId ?? null),
      listName: parsed.listName,
    };
    startTransition(async () => {
      try {
        await createTaskAction(input);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        enqueue({ kind: "create", id: crypto.randomUUID(), at: Date.now(), input });
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 mx-4 mt-4 rounded-xl bg-card px-3 shadow-[0_1px_8px_rgba(0,0,0,0.08)]"
    >
      {chips.length > 0 ? (
        <div aria-live="polite" className="flex flex-wrap items-center gap-1.5 pt-2.5">
          <span className="sr-only">{t.task.preview}</span>
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-2 py-0.5 text-[13px] text-accent-text"
            >
              {chip.icon}
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <IconCirclePlus size={22} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
        <label htmlFor="quick-add" className="sr-only">
          {t.task.quickAddLabel}
        </label>
        <input
          id="quick-add"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.task.quickAddPlaceholder}
          title={t.task.examples}
          enterKeyHint="done"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-[16px] outline-none placeholder:text-text-secondary"
        />
        {text.trim() ? (
          <button type="submit" disabled={pending} className="text-[15px] font-medium text-accent-text">
            {t.task.add}
          </button>
        ) : null}
      </div>
    </form>
  );
}
