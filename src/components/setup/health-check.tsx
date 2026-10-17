"use client";

import { IconAlertTriangle, IconCircleCheck, IconLoader2 } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SourceIcon } from "@/components/tasks/source-icon";
import { Button } from "@/components/ui/button";
import { SOURCE_KINDS, type SourceKind } from "@/lib/tasks/sources";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { pushState } from "@/lib/push/client";

export type HealthData = {
  installedSeenAt: Date | null;
  testPushReceivedAt: Date | null;
  claudeSeenAt: Date | null;
  claudeSources: string[];
};

const noop = () => () => {};
const standaloneNow = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function relative(date: Date, locale: string) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return rtf.format(seconds, "second");
  if (Math.abs(seconds) < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (Math.abs(seconds) < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86_400), "day");
}

/** The last onboarding step: every piece checked one by one, with the fix (D-009). */
export function HealthCheck({ data, onFinish }: { data: HealthData; onFinish?: { label: string; action: () => void } }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const standalone = useSyncExternalStore(noop, standaloneNow, () => false);
  const permission = useSyncExternalStore(noop, pushState, () => null);
  const [revealed, setRevealed] = useState(0);

  const sources = data.claudeSources.filter((s): s is SourceKind => (SOURCE_KINDS as readonly string[]).includes(s));
  const rows: { label: string; ok: boolean; fix?: string }[] = [
    { label: t.health.installed, ok: standalone || !!data.installedSeenAt, fix: t.health.installedFix },
    { label: t.health.notifications, ok: permission === "granted", fix: t.health.notificationsFix },
    { label: t.health.testReceived, ok: !!data.testPushReceivedAt, fix: t.health.testFix },
    {
      label: t.health.claude,
      ok: !!data.claudeSeenAt,
      fix: data.claudeSeenAt ? undefined : t.health.claudeFix,
    },
  ];
  const total = rows.length + Math.max(sources.length, 1);

  useEffect(() => {
    if (revealed >= total) return;
    const timer = setTimeout(() => setRevealed((n) => n + 1), 350);
    return () => clearTimeout(timer);
  }, [revealed, total]);

  const status = (ok: boolean, index: number) =>
    revealed <= index ? (
      <IconLoader2 size={20} className="shrink-0 animate-spin text-text-secondary" aria-label={t.common.loading} />
    ) : ok ? (
      <IconCircleCheck size={22} stroke={1.8} className="shrink-0 text-success" aria-hidden />
    ) : (
      <IconAlertTriangle size={20} stroke={1.8} className="shrink-0 text-warning" aria-hidden />
    );

  return (
    <div className="flex flex-col gap-5">
      <ul className="divide-y divide-separator overflow-hidden rounded-xl bg-card">
        {rows.map((row, i) => (
          <li key={row.label} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1">
              <span className="block text-[16px]">{row.label}</span>
              {revealed > i && (!row.ok || (i === 3 && data.claudeSeenAt)) ? (
                <span className="block text-[13px] text-text-secondary">
                  {row.ok && data.claudeSeenAt ? format(t.health.claudeSeen, { when: relative(data.claudeSeenAt, locale) }) : row.fix}
                </span>
              ) : null}
            </span>
            {status(row.ok, i)}
            <span className="sr-only">{revealed > i ? (row.ok ? "✓" : "!") : ""}</span>
          </li>
        ))}
      </ul>

      <div>
        <p className="px-4 pb-1.5 text-[13px] text-text-secondary">{t.health.sourcesTitle}</p>
        <p className="mb-2 rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-4 py-2.5 text-[14px]">
          {t.health.sourcesHint}
        </p>
        <ul className="divide-y divide-separator overflow-hidden rounded-xl bg-card">
          {sources.length > 0 ? (
            sources.map((kind, i) => (
              <li key={kind} className="flex items-center gap-3 px-4 py-3">
                <SourceIcon kind={kind} size={18} />
                <span className="flex-1 text-[16px]">{t.task.sources[kind]}</span>
                {status(true, rows.length + i)}
              </li>
            ))
          ) : (
            <li className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-[15px] text-text-secondary">{t.health.sourcesMissing}</span>
              {status(false, rows.length)}
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        {onFinish ? <Button onClick={onFinish.action}>{onFinish.label}</Button> : null}
        <Button
          variant="plain"
          onClick={() => {
            setRevealed(0);
            router.refresh();
          }}
        >
          {t.health.recheck}
        </Button>
      </div>
    </div>
  );
}
