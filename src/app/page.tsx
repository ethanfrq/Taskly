import { Logo } from "@/components/brand/logo";

const REPO_URL = "https://github.com/ethanfrq/Taskly";
const PROTOTYPE_URL =
  "https://htmlpreview.github.io/?https://github.com/ethanfrq/Taskly/blob/main/docs/design/prototype.html";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center">
        <h1>
          <Logo className="mx-auto h-12 w-auto" />
        </h1>
        <p className="mt-5 text-text-secondary">Ta journée, triée par Claude.</p>
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
