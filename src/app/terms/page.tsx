import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { TERMS } from "@/content/legal";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { title: `${TERMS[locale].title} · Taskly` };
}

export default async function TermsPage() {
  const { locale, t } = await getI18n();
  return <LegalPage doc={TERMS[locale]} backLabel={t.common.back} />;
}
