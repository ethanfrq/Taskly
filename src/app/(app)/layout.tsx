import { redirect } from "next/navigation";
import { themeCss } from "@/lib/theme/tokens";
import { OfflineSync } from "@/components/pwa/offline-sync";
import { InstalledReporter } from "./installed-reporter";
import { getAppContext } from "./context";
import { SideBar } from "./side-bar";
import { TabBar } from "./tab-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { prefs } = await getAppContext();
  if (!prefs.onboardedAt) redirect("/onboarding");
  return (
    <>
      <InstalledReporter />
      <OfflineSync />
      <style>{themeCss(prefs.accent, prefs.appearance)}</style>
      <SideBar />
      {/* Phones get the tab bar; from 1024px the sidebar takes its place and pages get room (a page opts into two columns with data-wide). */}
      <div className="flex flex-1 flex-col lg:pl-60">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-3xl lg:px-6 lg:pb-6 xl:has-[[data-wide]]:max-w-5xl">
          {children}
        </div>
      </div>
      <TabBar />
    </>
  );
}
