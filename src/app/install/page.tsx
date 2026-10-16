import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { InstallGuide } from "./install-guide";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.install.title} · Taskly` };
}

export default function InstallPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <InstallGuide />
    </main>
  );
}
