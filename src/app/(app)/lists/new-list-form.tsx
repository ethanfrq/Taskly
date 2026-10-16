"use client";

import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/i18n/client";
import { createListAction } from "../actions";
import { LIST_COLORS } from "./list-colors";

export function NewListForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(LIST_COLORS[0]);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 px-1 text-[17px] text-accent-text">
        <IconPlus size={20} stroke={2} aria-hidden />
        {t.lists.newList}
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          const { id } = await createListAction({ name, color });
          router.push(`/lists/${id}`);
        });
      }}
    >
      <label htmlFor="list-name" className="sr-only">
        {t.lists.newListPlaceholder}
      </label>
      <input
        id="list-name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.lists.newListPlaceholder}
        className="rounded-[10px] bg-fill px-3 py-2.5 text-[16px] outline-none"
      />
      <div role="radiogroup" aria-label={t.lists.color} className="flex flex-wrap gap-2.5">
        {LIST_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === color}
            aria-label={c}
            onClick={() => setColor(c)}
            className="size-8 rounded-full outline-offset-2 aria-checked:outline-2 aria-checked:outline-text"
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl py-2.5 text-[15px] text-accent-text">
          {t.common.cancel}
        </button>
        <button type="submit" disabled={pending || !name.trim()} className="flex-1 rounded-xl bg-accent py-2.5 text-[15px] font-medium text-on-accent disabled:opacity-50">
          {t.lists.create}
        </button>
      </div>
    </form>
  );
}
