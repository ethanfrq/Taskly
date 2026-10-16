import type { Metadata } from "next";
import { LanguageSwitch } from "@/components/language-switch";
import { SignOutButton } from "@/components/sign-out-button";
import { Group } from "@/components/ui/group";
import { getAppContext } from "../context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.settings.title} · Taskly` };
}

export default async function SettingsPage() {
  const { user, t } = await getAppContext();
  return (
    <div className="flex flex-col gap-6 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <h1 className="px-1 text-[34px] font-bold tracking-tight">{t.settings.title}</h1>
      <Group title={t.settings.account}>
        <p className="px-4 py-3 text-[16px]">{user.email}</p>
      </Group>
      <Group title={t.common.language}>
        <div className="p-3">
          <LanguageSwitch />
        </div>
      </Group>
      <SignOutButton />
    </div>
  );
}
