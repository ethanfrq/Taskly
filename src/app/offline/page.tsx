import type { Metadata } from "next";
import { en } from "@/i18n/dictionaries/en";
import { fr } from "@/i18n/dictionaries/fr";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = { title: "Taskly" };

/**
 * Cached by the service worker and shown when a page can't load.
 * Static and bilingual: it must not depend on cookies or the network.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 text-center">
      {[fr, en].map((t, i) => (
        <section key={i} lang={i === 0 ? "fr" : "en"}>
          <h1 className="text-[22px] font-bold">{t.offline.title}</h1>
          <p className="mt-2 text-text-secondary">{t.offline.body}</p>
        </section>
      ))}
      <RetryButton label={`${fr.offline.retry} · ${en.offline.retry}`} />
    </main>
  );
}
