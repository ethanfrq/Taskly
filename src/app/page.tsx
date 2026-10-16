const REPO_URL = "https://github.com/ethanfrq/Taskly";
const PROTOTYPE_URL =
  "https://htmlpreview.github.io/?https://github.com/ethanfrq/Taskly/blob/main/docs/design/prototype.html";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-[15px] bg-accent">
          <svg
            viewBox="0 0 24 24"
            className="size-8 text-on-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 12l5 5l10 -10" />
            <path d="M2 12l5 5m5 -5l5 -5" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Taskly</h1>
        <p className="mt-2 text-text-secondary">Ta journée, triée par Claude.</p>
        <p lang="en" className="text-text-secondary">
          Your day, sorted by Claude.
        </p>
        <p className="mt-6 inline-block rounded-full bg-fill px-3 py-1 text-sm">
          En construction · v0.1 en cours
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <a
            href={PROTOTYPE_URL}
            className="rounded-xl bg-accent px-4 py-3 font-medium text-on-accent"
          >
            Voir le prototype
          </a>
          <a href={REPO_URL} className="rounded-xl px-4 py-3 font-medium text-accent-text">
            Code source sur GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
