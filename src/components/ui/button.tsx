import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "plain" | "destructive";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent",
  secondary: "bg-card text-accent-text",
  plain: "bg-transparent text-accent-text",
  destructive: "bg-card text-[#FF3B30]",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return [
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-medium",
    "transition-opacity active:opacity-70 disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    VARIANTS[variant],
    extra,
  ].join(" ");
}

/** iOS-style full-width button. */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
