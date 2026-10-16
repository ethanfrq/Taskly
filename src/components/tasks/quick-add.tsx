"use client";

import { IconCirclePlus } from "@tabler/icons-react";
import { type FormEvent, useState, useTransition } from "react";
import { createTaskAction } from "@/app/(app)/actions";
import { useI18n } from "@/i18n/client";

/** The "new task" bar pinned above the tab bar. */
export function QuickAdd({ dueDate, listId }: { dueDate: string | null; listId?: string | null }) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle("");
    startTransition(async () => {
      await createTaskAction({ title: value, dueDate, listId: listId ?? null });
    });
  };

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 mx-4 mt-4 flex items-center gap-2 rounded-xl bg-card px-3 shadow-[0_1px_8px_rgba(0,0,0,0.08)]"
    >
      <IconCirclePlus size={22} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
      <label htmlFor="quick-add" className="sr-only">
        {t.task.quickAddLabel}
      </label>
      <input
        id="quick-add"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.task.quickAddPlaceholder}
        enterKeyHint="done"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-3 text-[16px] outline-none placeholder:text-text-secondary"
      />
      {title.trim() ? (
        <button type="submit" disabled={pending} className="text-[15px] font-medium text-accent-text">
          {t.task.add}
        </button>
      ) : null}
    </form>
  );
}
