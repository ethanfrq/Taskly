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
      className="group -m-2 flex size-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span
        className={`flex size-[22px] items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,scale] duration-200 group-active:scale-85 ${
          checked ? "border-accent bg-accent text-on-accent" : "border-text-secondary"
        }`}
      >
        {checked ? <IconCheck size={14} stroke={3} className="animate-[check-in_220ms_ease-out]" aria-hidden /> : null}
      </span>
    </button>
  );
}
