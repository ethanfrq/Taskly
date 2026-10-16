"use client";

import { IconChevronLeft, IconExternalLink, IconSparkles, IconTarget } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle } from "@/components/tasks/check-circle";
import { SourceIcon } from "@/components/tasks/source-icon";
import { Button } from "@/components/ui/button";
import { Group, GroupList } from "@/components/ui/group";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { TaskDetail } from "@/lib/tasks/service";
import { createTaskAction, deleteTaskAction, snoozeTaskAction, toggleTaskAction, updateTaskAction } from "../../actions";

type ListOption = { id: string; name: string; color: string | null };

const rowClass = "flex items-center justify-between gap-3 px-4 py-3 text-[16px]";
const inputClass = "bg-transparent text-right text-[16px] text-text-secondary outline-none";

export function TaskEditor({
  task,
  lists,
  today,
  participants,
}: {
  task: TaskDetail;
  lists: ListOption[];
  today: string;
  participants: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [tags, setTags] = useState(task.tagNames.join(", "));
  const [subtask, setSubtask] = useState("");
  const [snoozed, setSnoozed] = useState(false);

  const save = (patch: Parameters<typeof updateTaskAction>[1]) =>
    startTransition(async () => {
      await updateTaskAction(task.id, patch);
      router.refresh();
    });

  const back = () => (window.history.length > 1 ? router.back() : router.push("/today"));

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
      <button type="button" onClick={back} className="-ml-1 flex items-center text-[17px] text-accent-text">
        <IconChevronLeft size={26} stroke={1.8} aria-hidden />
        {t.common.back}
      </button>

      <div className="flex items-start gap-3 rounded-xl bg-card px-4 py-3">
        <div className="pt-1">
          <CheckCircle
            checked={!!task.completedAt}
            label={format(task.completedAt ? t.task.reopen : t.task.complete, { title: task.title })}
            onToggle={() =>
              startTransition(async () => {
                await toggleTaskAction(task.id, !task.completedAt);
                router.refresh();
              })
            }
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="title" className="sr-only">
            {t.task.titleLabel}
          </label>
          <textarea
            id="title"
            value={title}
            rows={1}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== task.title && save({ title })}
            className="field-sizing-content resize-none bg-transparent text-[20px] font-semibold outline-none"
          />
          <label htmlFor="notes" className="sr-only">
            {t.task.notesLabel}
          </label>
          <textarea
            id="notes"
            value={notes}
            placeholder={t.task.notesPlaceholder}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (task.notes ?? "") && save({ notes: notes || null })}
            className="field-sizing-content min-h-[1.5em] resize-none bg-transparent text-[15px] text-text-secondary outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      {task.source === "claude" || task.sourceUrl ? (
        <Group title={t.task.source}>
          <div className="flex items-center gap-2 px-4 py-3 text-[15px]">
            {task.source === "claude" ? <IconSparkles size={18} stroke={1.8} className="text-accent-text" aria-hidden /> : null}
            <span className="flex-1">
              {task.source === "claude" ? t.task.addedByClaude : null}
              {task.sourceKind ? (
                <span className="ml-1 text-text-secondary">
                  · <SourceIcon kind={task.sourceKind} /> {task.sourceLabel ?? t.task.sources[task.sourceKind]}
                </span>
              ) : null}
            </span>
            {task.sourceUrl ? (
              <a href={task.sourceUrl} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1 text-accent-text">
                {t.task.openSource}
                <IconExternalLink size={16} stroke={1.8} aria-hidden />
              </a>
            ) : null}
          </div>
        </Group>
      ) : null}

      <Group>
        <div className="divide-y divide-separator">
          <label className={rowClass}>
            {t.task.dateLabel}
            <input
              type="date"
              value={task.dueDate ?? ""}
              min={task.dueDate && task.dueDate < today ? task.dueDate : undefined}
              onChange={(e) => save({ dueDate: e.target.value || null })}
              className={inputClass}
            />
          </label>
          {task.dueDate ? (
            <label className={rowClass}>
              {t.task.timeLabel}
              <input
                type="time"
                value={task.dueTime ?? ""}
                onChange={(e) => save({ dueTime: e.target.value || null })}
                className={inputClass}
              />
            </label>
          ) : null}
          <label className={rowClass}>
            {t.task.listLabel}
            <select
              value={task.listId ?? ""}
              onChange={(e) => save({ listId: e.target.value || null })}
              className={`${inputClass} appearance-none`}
            >
              <option value="">{t.task.inbox}</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          {task.dueDate ? (
            <label className={rowClass}>
              {t.task.recurrenceLabel}
              <select
                value={task.recurrence?.startsWith("weekly:") ? "custom" : (task.recurrence ?? "")}
                onChange={(e) => e.target.value !== "custom" && save({ recurrence: e.target.value || null })}
                className={`${inputClass} appearance-none`}
              >
                <option value="">{t.task.recurrence.none}</option>
                <option value="daily">{t.task.recurrence.daily}</option>
                <option value="weekdays">{t.task.recurrence.weekdays}</option>
                <option value="weekly">{t.task.recurrence.weekly}</option>
                <option value="monthly">{t.task.recurrence.monthly}</option>
                {task.recurrence?.startsWith("weekly:") ? <option value="custom">{t.task.recurrence.custom}</option> : null}
              </select>
            </label>
          ) : null}
          {participants.length > 0 ? (
            <label className={rowClass}>
              {t.sharing.assignee}
              <select
                value={task.assigneeId ?? ""}
                onChange={(e) => save({ assigneeId: e.target.value || null })}
                className={`${inputClass} appearance-none`}
              >
                <option value="">{t.sharing.nobody}</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className={rowClass}>
            <span id="priority-label">{t.task.priorityLabel}</span>
            <div role="radiogroup" aria-labelledby="priority-label" className="flex rounded-[9px] bg-fill p-0.5">
              {[0, 1, 2, 3].map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={task.priority === level}
                  aria-label={t.task.priority[level]}
                  onClick={() => save({ priority: level })}
                  className="min-w-9 rounded-[7px] px-2 py-1 text-[14px] aria-checked:bg-card aria-checked:font-semibold"
                >
                  {level === 0 ? "–" : "!".repeat(level)}
                </button>
              ))}
            </div>
          </div>
          <label className={rowClass}>
            {t.task.tagsLabel}
            <input
              value={tags}
              placeholder={t.task.tagsPlaceholder}
              onChange={(e) => setTags(e.target.value)}
              onBlur={() =>
                tags !== task.tagNames.join(", ") &&
                save({ tags: tags.split(",").map((s) => s.trim()).filter(Boolean) })
              }
              className={`${inputClass} min-w-0 flex-1`}
            />
          </label>
        </div>
      </Group>

      {task.dueTime && !task.completedAt ? (
        <Group title={t.reminders.snoozeLabel} footer={snoozed ? t.reminders.snoozed : undefined}>
          <div className="flex gap-2 p-3">
            {(
              [
                ["15", t.reminders.snooze15],
                ["60", t.reminders.snooze60],
                ["tomorrow", t.reminders.snoozeTomorrow],
              ] as const
            ).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await snoozeTaskAction(task.id, preset);
                    setSnoozed(true);
                    router.refresh();
                  })
                }
                className="flex-1 rounded-[10px] bg-fill py-2 text-[15px] text-accent-text"
              >
                {label}
              </button>
            ))}
          </div>
        </Group>
      ) : null}

      <Group title={t.task.subtasks}>
        <GroupList>
          {task.subtaskList.map((sub) => (
            <li key={sub.id} className="flex items-center gap-3 px-4 py-2.5">
              <CheckCircle
                checked={!!sub.completedAt}
                label={format(sub.completedAt ? t.task.reopen : t.task.complete, { title: sub.title })}
                onToggle={() =>
                  startTransition(async () => {
                    await toggleTaskAction(sub.id, !sub.completedAt);
                    router.refresh();
                  })
                }
              />
              <span className={`text-[16px] ${sub.completedAt ? "text-text-secondary line-through" : ""}`}>{sub.title}</span>
            </li>
          ))}
          <li className="px-4 py-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = subtask.trim();
                if (!value) return;
                setSubtask("");
                startTransition(async () => {
                  await createTaskAction({ title: value, parentId: task.id });
                  router.refresh();
                });
              }}
            >
              <label htmlFor="subtask" className="sr-only">
                {t.task.addSubtask}
              </label>
              <input
                id="subtask"
                value={subtask}
                onChange={(e) => setSubtask(e.target.value)}
                placeholder={t.task.addSubtask}
                className="w-full bg-transparent py-1.5 text-[16px] outline-none placeholder:text-accent-text"
              />
            </form>
          </li>
        </GroupList>
      </Group>

      {!task.completedAt && !task.parentId ? (
        <Link
          href={`/focus?task=${task.id}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-card px-4 py-3 text-[15px] font-medium text-accent-text"
        >
          <IconTarget size={20} stroke={1.8} aria-hidden />
          {t.focus.title}
        </Link>
      ) : null}

      <Button
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(format(t.task.deleteConfirm, { title: task.title }))) return;
          startTransition(async () => {
            await deleteTaskAction(task.id);
            back();
          });
        }}
      >
        {t.task.delete}
      </Button>
    </div>
  );
}
