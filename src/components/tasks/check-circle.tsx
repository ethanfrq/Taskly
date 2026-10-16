"use client";

import { IconCheck } from "@tabler/icons-react";

/** The round iOS checkbox. */
export function CheckCircle({
  checked,
  label,
  onToggle,
  disabled,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="-m-2 flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span
        className={`flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-colors ${
          checked ? "border-accent bg-accent text-on-accent" : "border-text-secondary"
        }`}
      >
        {checked ? <IconCheck size={14} stroke={3} aria-hidden /> : null}
      </span>
    </button>
  );
}
