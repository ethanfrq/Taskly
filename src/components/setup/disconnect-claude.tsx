"use client";

import { IconPlugConnectedX } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { disconnectClaudeAction } from "@/lib/claude-actions";

/** Revokes Claude's access, after a confirmation (it can't be undone from Taskly). */
export function DisconnectClaude() {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <div className="overflow-hidden rounded-xl bg-card">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-[#FF3B30]"
        >
          <IconPlugConnectedX size={20} stroke={1.8} aria-hidden />
          <span className="text-[16px]">{t.claude.disconnect}</span>
        </button>
      </div>
      <p className="px-4 pt-1.5 text-[13px] text-text-secondary">{t.claude.disconnectHint}</p>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="disconnect-title"
          // It opens below the fold on a phone: bring it into view.
          ref={(node) => node?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
          className="mt-3 flex flex-col gap-3 rounded-xl bg-card p-4"
        >
          <p id="disconnect-title" className="text-[17px] font-semibold">
            {t.claude.disconnectTitle}
          </p>
          <p className="text-[15px] text-text-secondary">{t.claude.disconnectBody}</p>
          <div className="flex gap-2">
            <Button variant="plain" onClick={() => setConfirming(false)}>
              {t.common.cancel}
            </Button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => disconnectClaudeAction())}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#FF3B30] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {t.claude.disconnectConfirm}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
