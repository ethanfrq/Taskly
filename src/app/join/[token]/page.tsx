import type { Metadata } from "next";
import { getDb } from "@/db";
import { format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/auth/session";
import { getInvite } from "@/lib/tasks/service";
import { JoinButton } from "./join-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.sharing.join} · Taskly` };
}

/**
 * Landing page of a shared list's invite link. Outside the app shell on
 * purpose: someone new can join first, then go through onboarding.
 */
export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  await requireUser(`/join/${token}`);
  const { t } = await getI18n();
  const invite = await getInvite(getDb(), token);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      {invite ? (
        <>
          <span className="size-14 rounded-full" style={{ background: invite.color ?? "var(--accent)" }} aria-hidden />
          <h1 className="text-[26px] font-bold tracking-tight">{format(t.sharing.joinTitle, { name: invite.name })}</h1>
          <p className="text-[16px] text-text-secondary">{format(t.sharing.joinBody, { owner: invite.ownerName || invite.ownerEmail })}</p>
          <p className="text-[13px] text-text-secondary">{t.sharing.conflicts}</p>
          <div className="w-full max-w-xs pt-4">
            <JoinButton token={token} label={t.sharing.join} />
          </div>
        </>
      ) : (
        <p className="text-[16px] text-text-secondary">{t.sharing.invalid}</p>
      )}
    </main>
  );
}
