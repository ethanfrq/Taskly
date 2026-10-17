"use client";

import { IconChevronRight, IconPlugConnected, IconRefresh, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";

/** How long Today keeps checking for Claude's tasks after the user sent them to Claude. */
const WATCH_MS = 3 * 60_000;
const WATCH_EVERY_MS = 8_000;

export type ClaudeState = { connected: boolean; preparedToday: boolean };

/**
 * One tap to have Claude fill the day. Taskly never calls Claude (ADR 0001):
 * this opens Claude with the sentence its MCP instructions answer to, copies
 * it too (claude.ai's ?q= prefill isn't documented), then watches for the
 * tasks Claude adds so they show up without a reload.
 */
export function PrepareWithClaude({ claude, className = "" }: { claude: ClaudeState; className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [watchUntil, setWatchUntil] = useState(0);

  // Back from Claude (or any other app): show what changed meanwhile.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  // Claude side by side on a computer: the page stays visible, so check every few seconds for a while.
  useEffect(() => {
    if (!watchUntil) return;
    const timer = setInterval(() => {
      if (Date.now() > watchUntil) return setWatchUntil(0);
      if (document.visibilityState === "visible") router.refresh();
    }, WATCH_EVERY_MS);
    return () => clearInterval(timer);
  }, [watchUntil, router]);

  if (!claude.connected) {
    return (
      <Link href="/settings/claude" className={`${TILE} ${className}`}>
        <span className={`${BADGE} bg-fill text-accent-text`}>
          <IconPlugConnected size={20} stroke={1.8} aria-hidden />
        </span>
        <Text title={t.today.connectTitle} body={t.today.connectBody} />
      </Link>
    );
  }

  const refresh = claude.preparedToday;
  const prompt = refresh ? t.today.refreshPrompt : t.today.preparePrompt;
  const send = () => {
    navigator.clipboard?.writeText(prompt).catch(() => {});
    setWatchUntil(Date.now() + WATCH_MS);
  };

  return (
    <div className={className}>
      <a
        href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={send}
        className={TILE}
      >
        <span className={`${BADGE} ${refresh ? "bg-fill text-accent-text" : "bg-accent text-on-accent"}`}>
          {refresh ? <IconRefresh size={20} stroke={1.8} aria-hidden /> : <IconSparkles size={20} stroke={1.8} aria-hidden />}
        </span>
        <Text
          title={refresh ? t.today.refreshTitle : t.today.prepareTitle}
          body={refresh ? t.today.refreshBody : t.today.prepareBody}
        />
      </a>
      {watchUntil ? (
        <p role="status" className="px-1 pt-2 text-[13px] text-text-secondary">
          {format(t.today.promptSent, { prompt })}
        </p>
      ) : null}
    </div>
  );
}

const TILE =
  "flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left transition-[background-color,scale] hover:bg-[color-mix(in_srgb,var(--fill)_45%,var(--card))] active:scale-[0.98]";
const BADGE = "flex size-10 shrink-0 items-center justify-center rounded-full";

function Text({ title, body }: { title: string; body: string }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight">{title}</span>
        <span className="mt-0.5 block text-[13px] text-text-secondary">{body}</span>
      </span>
      <IconChevronRight size={18} stroke={1.8} className="shrink-0 text-text-secondary" aria-hidden />
    </>
  );
}
