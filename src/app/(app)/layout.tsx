import { redirect } from "next/navigation";
import { themeCss } from "@/lib/theme/tokens";
import { OfflineSync } from "@/components/pwa/offline-sync";
import { InstalledReporter } from "./installed-reporter";
import { getAppContext } from "./context";
import { TabBar } from "./tab-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { prefs } = await getAppContext();
  if (!prefs.onboardedAt) redirect("/onboarding");
  return (
    <>
      <InstalledReporter />
      <OfflineSync />
      <style>{themeCss(prefs.accent, prefs.appearance)}</style>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <TabBar />
    </>
  );
}
