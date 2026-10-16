import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { PRIVACY } from "@/content/legal";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { title: `${PRIVACY[locale].title} · Taskly` };
}

export default async function PrivacyPage() {
  const { locale, t } = await getI18n();
  return <LegalPage doc={PRIVACY[locale]} backLabel={t.common.back} />;
}
