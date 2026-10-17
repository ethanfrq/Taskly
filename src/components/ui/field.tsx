import type { InputHTMLAttributes } from "react";

/** Grouped-style text field with a visually hidden label and an error line. */
export function Field({
  label,
  error,
  id,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null; id: string }) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          "w-full rounded-[10px] bg-card px-3.5 py-3 text-[16px] text-text outline-none",
          "placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-accent",
          error ? "ring-2 ring-danger" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="px-1 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
