import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import type { LegalDoc } from "@/content/legal";

export function LegalPage({ doc, backLabel }: { doc: LegalDoc; backLabel: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-12">
      <Link href="/" className="-ml-1.5 flex w-fit items-center text-[17px] text-accent-text">
        <IconChevronLeft size={26} stroke={1.8} aria-hidden />
        {backLabel}
      </Link>
      <h1 className="text-[30px] font-bold tracking-tight">{doc.title}</h1>
      <p className="text-[16px] text-text-secondary">{doc.intro}</p>
      {doc.sections.map((section) => (
        <section key={section.title} className="rounded-xl bg-card p-4">
          <h2 className="text-[17px] font-semibold">{section.title}</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px]">
            {section.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
