import { IconChevronRight, IconPlugConnected } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LanguageSwitch } from "@/components/language-switch";
import { NotificationSetup } from "@/components/setup/notification-setup";
import { SignOutButton } from "@/components/sign-out-button";
import { Group } from "@/components/ui/group";
import { getAppContext } from "../context";
import { PreferencesForm } from "./preferences-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.settings.title} · Taskly` };
}

export default async function SettingsPage() {
  const { user, prefs, t } = await getAppContext();
  const initial = {
    accent: prefs.accent,
    appearance: prefs.appearance,
    briefingTime: prefs.briefingTime,
    reviewTime: prefs.reviewTime,
    quietStart: prefs.quietStart,
    quietEnd: prefs.quietEnd,
    insistence: prefs.insistence,
    followUpPriorityOnly: prefs.followUpPriorityOnly,
  };
  return (
    <div className="flex flex-col gap-7 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <h1 className="px-1 text-[34px] font-bold tracking-tight">{t.settings.title}</h1>

      <Group title={t.settings.account}>
        <p className="px-4 py-3 text-[16px]">{user.email}</p>
      </Group>

      <Group title={t.claude.title}>
        <Link href="/settings/claude" className="flex items-center gap-3 px-4 py-3">
          <IconPlugConnected size={22} stroke={1.8} className="text-accent-text" aria-hidden />
          <span className="flex-1 text-[16px]">{prefs.claudeSeenAt ? t.health.claude : t.claude.title}</span>
          <IconChevronRight size={18} className="text-text-secondary" aria-hidden />
        </Link>
      </Group>

      <section>
        <h2 className="px-4 pb-1.5 text-[13px] text-text-secondary">{t.settings.appearance}</h2>
        <PreferencesForm initial={initial} section="appearance" />
      </section>

      <section>
        <h2 className="px-4 pb-1.5 text-[13px] text-text-secondary">{t.notifications.title}</h2>
        <div className="rounded-xl bg-card px-4 py-6">
          <NotificationSetup testReceived={!!prefs.testPushReceivedAt} />
        </div>
      </section>

      <section>
        <h2 className="px-4 pb-1.5 text-[13px] text-text-secondary">{t.rhythm.title}</h2>
        <PreferencesForm initial={initial} section="rhythm" />
      </section>

      <Group title={t.common.language}>
        <div className="p-3">
          <LanguageSwitch />
        </div>
      </Group>

      <SignOutButton />
    </div>
  );
}
