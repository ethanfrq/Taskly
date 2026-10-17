"use client";

import { IconCheck, IconPencil, IconRefresh, IconTrash } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import type { FieldChanges } from "@/db/schema";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/format";
import type { RefreshSummary } from "@/lib/tasks/refresh";
import { undoRefreshAction } from "../actions";

const ICONS = { update: IconPencil, complete: IconCheck, remove: IconTrash } as const;

/** "Claude refreshed 3 tasks": what changed, why, and a way back (ADR 0008). */
export function RefreshBanner({ refresh, onUndone }: { refresh: RefreshSummary; onUndone: (notice: string) => void }) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const value = (field: keyof FieldChanges, v: unknown): string => {
    if (v === null || v === undefined || v === "" || v === 0) return t.today.refreshEmpty;
    if (field === "priority") return "!".repeat(Number(v));
    if (field === "dueDate") {
      const [y, m, d] = String(v).split("-").map(Number);
      return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
    }
    return String(v);
  };
  const details = (changes: FieldChanges | null) =>
    Object.entries(changes ?? {}).map(([field, c]) =>
      field === "notes"
        ? t.today.refreshFields.notes
        : `${t.today.refreshFields[field as keyof FieldChanges]} : ${value(field as keyof FieldChanges, c.from)} → ${value(field as keyof FieldChanges, c.to)}`,
    );

  const undo = () =>
    startTransition(async () => {
      const { restored } = await undoRefreshAction(refresh.batchId);
      onUndone(plural(locale, restored, t.today.refreshUndone));
    });

  return (
    <div className="mx-4 mt-3 overflow-hidden rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] text-[14px]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <IconRefresh size={18} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
        <span className="flex-1">{plural(locale, refresh.items.length, t.today.refreshBanner)}</span>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="font-medium text-accent-text">
          {open ? t.today.refreshHide : t.today.refreshShow}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={undo}
          aria-label={t.today.refreshUndoLabel}
          className="ml-2 font-medium text-accent-text"
        >
          {t.today.refreshUndo}
        </button>
      </div>
      {open ? (
        <ul className="divide-y divide-separator border-t border-separator">
          {refresh.items.map((item) => {
            const Icon = ICONS[item.action];
            return (
              <li key={item.taskId} className="flex gap-2.5 px-3 py-2.5">
                <Icon size={16} stroke={1.8} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={item.action === "remove" ? "text-text-secondary line-through" : ""}>{item.title}</p>
                  <p className="text-[13px] text-text-secondary">
                    {t.today.refreshActions[item.action]} · {item.reason}
                  </p>
                  {details(item.changes).map((line) => (
                    <p key={line} className="text-[13px] text-text-secondary tabular-nums">
                      {line}
                    </p>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
