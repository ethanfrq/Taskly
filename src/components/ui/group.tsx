import type { ReactNode } from "react";

/** iOS inset grouped section: a small caption above a rounded card. */
export function Group({
  title,
  children,
  footer,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {title ? <h2 className="px-4 pb-1.5 text-[13px] text-text-secondary">{title}</h2> : null}
      <div className="overflow-hidden rounded-xl bg-card">{children}</div>
      {footer ? <div className="px-4 pt-1.5 text-[13px] text-text-secondary">{footer}</div> : null}
    </section>
  );
}

/** A list inside a Group, with hairline separators inset from the left. */
export function GroupList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-separator [&>li]:ml-0">{children}</ul>;
}
