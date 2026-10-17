"use client";

import { IconArrowsLeftRight, IconCalendar, IconEye, IconMail, IconPencil, IconPlugConnected, IconRefresh } from "@tabler/icons-react";
import { useEffect, useState, useTransition } from "react";
import { Monogram } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { authClient } from "@/lib/auth/client";

const ICONS: Record<string, typeof IconEye> = {
  "tasks:read": IconEye,
  "tasks:write": IconPencil,
  offline_access: IconRefresh,
  email: IconMail,
};

export function ConsentForm({ email, clientId, scopes }: { email: string; clientId: string; scopes: string[] }) {
  const { t } = useI18n();
  const [client, setClient] = useState<{ name?: string; icon?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!clientId) return;
    authClient.oauth2
      .publicClient({ query: { client_id: clientId } })
      .then(({ data }) => {
        const info = data as { client_name?: string; logo_uri?: string } | null;
        if (info) setClient({ name: info.client_name, icon: info.logo_uri });
      })
      .catch(() => undefined);
  }, [clientId]);

  const shown = scopes.filter((s) => s in t.consent.scopes) as (keyof typeof t.consent.scopes)[];

  const answer = (accept: boolean) =>
    startTransition(async () => {
      setError(null);
      const { error: err } = await authClient.oauth2.consent({ accept });
      // On success the client follows the redirect back to Claude.
      if (err) setError(t.consent.expired);
    });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-center gap-3">
        <span className="flex size-14 items-center justify-center overflow-hidden rounded-[14px] bg-card">
          {client?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- a third-party logo URL, not a local asset
            <img src={client.icon} alt="" className="size-full object-cover" />
          ) : (
            <IconPlugConnected size={28} stroke={1.6} className="text-text-secondary" aria-hidden />
          )}
        </span>
        <IconArrowsLeftRight size={20} stroke={1.8} className="text-text-secondary" aria-hidden />
        <span className="flex size-14 items-center justify-center rounded-[14px] bg-[#171717] text-[#F5F3ED]">
          <Monogram title="" className="size-8" />
        </span>
      </div>

      <h1 className="mt-6 text-center text-[24px] font-bold tracking-tight">
        {format(t.consent.title, { client: client?.name ?? t.consent.unknownClient })}
      </h1>

      <ul className="mt-6 divide-y divide-separator overflow-hidden rounded-xl bg-card">
        {shown.map((scope) => {
          const Icon = ICONS[scope] ?? IconCalendar;
          return (
            <li key={scope} className="flex items-center gap-3 px-4 py-3">
              <Icon size={20} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
              <span className="text-[15px]">{t.consent.scopes[scope]}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 px-1 text-[13px] text-text-secondary">{t.consent.note}</p>
      {error ? (
        <p role="alert" className="mt-3 px-1 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <p className="text-center text-[13px] text-text-secondary">{format(t.consent.signedInAs, { email })}</p>
        <Button onClick={() => answer(true)} disabled={pending}>
          {t.consent.allow}
        </Button>
        <Button variant="plain" onClick={() => answer(false)} disabled={pending}>
          {t.consent.deny}
        </Button>
      </div>
    </main>
  );
}
