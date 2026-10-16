import { IconChevronLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClaudeConnect } from "@/components/setup/claude-connect";
import { HealthCheck } from "@/components/setup/health-check";
import { getBaseUrl } from "@/lib/url";
import { getAppContext } from "../../context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.claude.title} · Taskly` };
}

export default async function ClaudeSettingsPage() {
  const { prefs, t } = await getAppContext();
  return (
    <div className="flex flex-col gap-6 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
      <Link href="/settings" className="-ml-1 flex w-fit items-center text-[17px] text-accent-text">
        <IconChevronLeft size={26} stroke={1.8} aria-hidden />
        {t.settings.title}
      </Link>
      <div>
        <h1 className="text-[30px] font-bold tracking-tight">{t.claude.title}</h1>
        <p className="mt-2 text-[16px] text-text-secondary">{t.claude.body}</p>
      </div>
      <ClaudeConnect mcpUrl={`${getBaseUrl()}/api/mcp`} />
      <h2 className="mt-2 text-[22px] font-bold tracking-tight">{t.health.title}</h2>
      <HealthCheck
        data={{
          installedSeenAt: prefs.installedSeenAt,
          testPushReceivedAt: prefs.testPushReceivedAt,
          claudeSeenAt: prefs.claudeSeenAt,
          claudeSources: prefs.claudeSources?.split(",").filter(Boolean) ?? [],
        }}
      />
    </div>
  );
}
