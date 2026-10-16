import type { Metadata } from "next";
import { getDb } from "@/db";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/auth/session";
import { getPreferences } from "@/lib/preferences";
import { themeCss } from "@/lib/theme/tokens";
import { getBaseUrl } from "@/lib/url";
import { OnboardingFlow } from "./onboarding-flow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.onboarding.welcomeTitle} · Taskly` };
}

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const prefs = await getPreferences(getDb(), user.id);
  return (
    <>
      <style>{themeCss(prefs.accent, prefs.appearance)}</style>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <OnboardingFlow
          initial={{
            accent: prefs.accent,
            appearance: prefs.appearance,
            briefingTime: prefs.briefingTime,
            reviewTime: prefs.reviewTime,
            quietStart: prefs.quietStart,
            quietEnd: prefs.quietEnd,
            insistence: prefs.insistence,
            followUpPriorityOnly: prefs.followUpPriorityOnly,
          }}
          health={{
            installedSeenAt: prefs.installedSeenAt,
            testPushReceivedAt: prefs.testPushReceivedAt,
            claudeSeenAt: prefs.claudeSeenAt,
            claudeSources: prefs.claudeSources?.split(",").filter(Boolean) ?? [],
          }}
          mcpUrl={`${getBaseUrl()}/api/mcp`}
        />
      </main>
    </>
  );
}
