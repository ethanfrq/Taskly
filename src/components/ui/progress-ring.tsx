/** The daily progress ring (design D-001). */
export function ProgressRing({ done, total, size = 40 }: { done: number; total: number; size?: number }) {
  const circumference = 2 * Math.PI * 15;
  const filled = total > 0 ? (circumference * done) / total : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden className="shrink-0 -rotate-90">
      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--separator)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        className="transition-[stroke-dasharray] duration-500"
      />
    </svg>
  );
}
