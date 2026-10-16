"use client";

import { IconBuilding, IconCheck, IconCopy, IconInfoCircle, IconShare } from "@tabler/icons-react";
import { useState } from "react";
import { useI18n } from "@/i18n/client";

/** How to add Taskly as a custom connector, per Claude plan. */
export function ClaudeConnect({ mcpUrl }: { mcpUrl: string }) {
  const { t } = useI18n();
  const [plan, setPlan] = useState(1);
  const [copied, setCopied] = useState(false);
  const steps = plan === 2 ? t.claude.teamSteps : t.claude.steps;

  const copy = async () => {
    if (plan === 2 && navigator.share) {
      await navigator.share({ title: "Taskly", text: mcpUrl }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="px-1 pb-1.5 text-[13px] text-text-secondary" id="plan-label">
          {t.claude.planLabel}
        </p>
        <div role="radiogroup" aria-labelledby="plan-label" className="flex rounded-[9px] bg-fill p-0.5">
          {t.claude.plans.map((label, i) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={plan === i}
              onClick={() => setPlan(i)}
              className="flex-1 rounded-[7px] px-1 py-1.5 text-[13px] aria-checked:bg-card aria-checked:font-semibold"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {plan !== 1 ? (
        <p className="flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-3 py-2.5 text-[14px]">
          {plan === 0 ? (
            <IconInfoCircle size={18} stroke={1.8} className="mt-0.5 shrink-0 text-accent-text" aria-hidden />
          ) : (
            <IconBuilding size={18} stroke={1.8} className="mt-0.5 shrink-0 text-accent-text" aria-hidden />
          )}
          {plan === 0 ? t.claude.freeNote : t.claude.teamNote}
        </p>
      ) : null}

      <ol className="divide-y divide-separator overflow-hidden rounded-xl bg-card">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-fill text-[13px] font-semibold">{i + 1}</span>
            <span className="text-[15px]">{step}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
        <code className="min-w-0 flex-1 truncate font-mono text-[13px]" aria-label={t.claude.urlLabel}>
          {mcpUrl}
        </code>
        <button type="button" onClick={copy} className="flex shrink-0 items-center gap-1 text-[15px] font-medium text-accent-text">
          {copied ? <IconCheck size={18} aria-hidden /> : plan === 2 ? <IconShare size={18} aria-hidden /> : <IconCopy size={18} aria-hidden />}
          {copied ? t.claude.copied : plan === 2 ? t.claude.share : t.claude.copy}
        </button>
      </div>
      <p className="px-1 text-[13px] text-text-secondary">{t.claude.morningTip}</p>
    </div>
  );
}
