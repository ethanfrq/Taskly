"use client";

import { IconCalendar, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui/button";
import { Group } from "@/components/ui/group";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useI18n } from "@/i18n/client";
import { format, plural } from "@/i18n/format";
import { deleteTaskAction, moveToTomorrowAction } from "../actions";

type Props = {
  dateLabel: string;
  done: number;
  total: number;
  left: { id: string; title: string }[];
  tomorrowCount: number;
};

/** The evening review: what's done, and one tap to carry the rest over. */
export function ReviewView({ dateLabel, done, total, left, tomorrowCount }: Props) {
  const { locale, t } = useI18n();
  const [outcome, setOutcome] = useState<Record<string, "moved" | "removed">>({});
  const [pending, startTransition] = useTransition();
  const remaining = left.filter((task) => !outcome[task.id]);

  const move = (ids: string[]) =>
    startTransition(async () => {
      setOutcome((o) => ({ ...o, ...Object.fromEntries(ids.map((id) => [id, "moved" as const])) }));
      await moveToTomorrowAction(ids);
    });
  const remove = (id: string) =>
    startTransition(async () => {
      setOutcome((o) => ({ ...o, [id]: "removed" }));
      await deleteTaskAction(id);
    });

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
      <header className="px-1">
        <p className="text-[13px] text-text-secondary">{dateLabel}</p>
        <h1 className="text-[34px] font-bold tracking-tight">{t.review.title}</h1>
      </header>

      <div className="flex items-center gap-4 rounded-xl bg-card p-4">
        <ProgressRing done={done} total={total} size={60} />
        <div>
          <p className="text-[24px] font-semibold">{format(t.review.done, { done, total })}</p>
          <p className="text-[14px] text-text-secondary">{t.review.doneLabel}</p>
        </div>
      </div>

      <Group title={t.review.left}>
        {left.length === 0 ? (
          <p className="px-4 py-4 text-[16px]">{t.review.allDone}</p>
        ) : (
          <ul className="divide-y divide-separator">
            {left.map((task) => (
              <li key={task.id} className="flex items-center gap-2 px-4 py-2.5">
                <span className={`min-w-0 flex-1 truncate text-[16px] ${outcome[task.id] ? "text-text-secondary" : ""}`}>{task.title}</span>
                {outcome[task.id] ? (
                  <span className="text-[14px] text-text-secondary">
                    {outcome[task.id] === "moved" ? t.review.moved : t.review.removed}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => move([task.id])}
                      className="rounded-full bg-fill px-3 py-1 text-[14px] text-accent-text"
                    >
                      {t.review.toTomorrow}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(task.id)}
                      aria-label={format(t.task.deleteConfirm, { title: task.title })}
                      className="rounded-full bg-fill p-1.5 text-text-secondary"
                    >
                      <IconTrash size={16} stroke={1.8} aria-hidden />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Group>

      <Group title={t.review.tomorrow}>
        <p className="flex items-center gap-3 px-4 py-3 text-[16px]">
          <IconCalendar size={20} stroke={1.8} className="text-accent-text" aria-hidden />
          {plural(locale, tomorrowCount + Object.values(outcome).filter((o) => o === "moved").length, t.review.tomorrowPlanned)}
        </p>
      </Group>

      <div className="mt-auto flex flex-col gap-2">
        {remaining.length > 1 ? (
          <button type="button" disabled={pending} onClick={() => move(remaining.map((x) => x.id))} className={buttonClass("secondary")}>
            {t.review.moveAll}
          </button>
        ) : null}
        <Link href="/today" className={buttonClass("primary")}>
          {t.review.finish}
        </Link>
      </div>
    </div>
  );
}
