/** Shown the instant a tab is tapped, while the server prepares the page: its outline, not a spinner. */
export default function Loading() {
  return (
    <div aria-busy className="flex flex-1 flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="ml-1 h-3 w-28 rounded-full bg-fill" />
      <div className="mt-3 ml-1 h-8 w-44 rounded-lg bg-fill" />
      <div className="mt-6 overflow-hidden rounded-xl bg-card">
        {[72, 55, 64, 40].map((width) => (
          <div key={width} className="flex items-center gap-3 border-b border-separator px-4 py-3.5 last:border-0">
            <div className="size-[22px] shrink-0 rounded-full border-[1.5px] border-fill" />
            <div className="h-3.5 rounded-full bg-fill" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        …
      </span>
    </div>
  );
}
