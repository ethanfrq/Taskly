import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Monogram } from "@/components/brand/logo";
import { getI18n } from "@/i18n/server";
import { signInCodesInLogs } from "@/lib/auth/allowed-emails";
import { getSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/safe-next";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.auth.signInTitle} · Taskly` };
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  // An OAuth authorization (Claude connecting) carries a signed query: stay on the page.
  const oauth = typeof params.sig === "string" && typeof params.client_id === "string";
  if (!oauth && (await getSession())) redirect(next);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Monogram title="" className="mb-8 h-11 w-11" />
      <SignInForm next={next} oauth={oauth} codeInLogs={signInCodesInLogs()} />
    </main>
  );
}
