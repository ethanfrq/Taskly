"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Monogram } from "@/components/brand/logo";
import { LanguageSwitch } from "@/components/language-switch";
import { AccentPicker } from "@/components/setup/accent-picker";
import { ClaudeConnect } from "@/components/setup/claude-connect";
import { type HealthData, HealthCheck } from "@/components/setup/health-check";
import { NotificationSetup } from "@/components/setup/notification-setup";
import { type Rhythm, RhythmForm } from "@/components/setup/rhythm-form";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { completeOnboardingAction, savePreferencesAction } from "@/lib/preferences-actions";
import type { Appearance } from "@/lib/theme/tokens";

const STEPS = ["welcome", "color", "notifications", "rhythm", "claude", "health"] as const;

type Props = {
  initial: Rhythm & { accent: string; appearance: Appearance };
  health: HealthData;
  mcpUrl: string;
};

export function OnboardingFlow({ initial, health, mcpUrl }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const step = Math.min(Math.max(Number(params.get("step") ?? 0) || 0, 0), STEPS.length - 1);
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  // The time zone and language come from the device, once.
  useEffect(() => {
    void savePreferencesAction({ timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale });
  }, [locale]);

  const go = (next: number) => router.push(`/onboarding?step=${next}`, { scroll: true });
  const update = (patch: Partial<typeof values>) => {
    setValues((v) => ({ ...v, ...patch }));
    startTransition(() => savePreferencesAction(patch));
  };
  const next = () => go(step + 1);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-11 items-center">
        {step > 0 ? (
          <button type="button" onClick={() => go(step - 1)} className="-ml-1.5 flex items-center text-[17px] text-accent-text">
            <IconChevronLeft size={26} stroke={1.8} aria-hidden />
            {t.common.back}
          </button>
        ) : null}
        <div
          className="ml-auto flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={format(t.onboarding.stepOf, { step: step + 1, total: STEPS.length })}
        >
          {STEPS.map((name, i) => (
            <span key={name} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-accent" : "w-1.5 bg-separator"}`} />
          ))}
        </div>
      </div>

      {STEPS[step] === "welcome" ? (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Monogram title="" className="h-20 w-20" />
            <h1 className="mt-6 text-[30px] font-bold tracking-tight">{t.onboarding.welcomeTitle}</h1>
            <p className="mt-3 max-w-xs text-[17px] text-text-secondary">{t.onboarding.welcomeBody}</p>
            <div className="mt-8 w-full">
              <LanguageSwitch />
            </div>
          </div>
          <Button onClick={next}>{t.onboarding.start}</Button>
        </div>
      ) : null}

      {STEPS[step] === "color" ? (
        <div className="flex flex-1 flex-col gap-6 pt-4">
          <h1 className="text-[30px] font-bold tracking-tight">{t.onboarding.colorTitle}</h1>
          <AccentPicker accent={values.accent} appearance={values.appearance} onChange={update} />
          <div className="mt-auto">
            <Button onClick={next} disabled={pending}>
              {t.common.continue}
            </Button>
          </div>
        </div>
      ) : null}

      {STEPS[step] === "notifications" ? (
        <div className="flex flex-1 flex-col justify-center gap-6">
          <NotificationSetup testReceived={!!health.testPushReceivedAt} onDone={{ label: t.common.continue, action: next }} />
          <Button variant="plain" onClick={next}>
            {t.common.later}
          </Button>
        </div>
      ) : null}

      {STEPS[step] === "rhythm" ? (
        <div className="flex flex-1 flex-col gap-6 pt-4">
          <h1 className="text-[30px] font-bold tracking-tight">{t.rhythm.title}</h1>
          <RhythmForm value={values} onChange={update} />
          <div className="mt-auto">
            <Button onClick={next} disabled={pending}>
              {t.common.continue}
            </Button>
          </div>
        </div>
      ) : null}

      {STEPS[step] === "claude" ? (
        <div className="flex flex-1 flex-col gap-5 pt-4">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight">{t.claude.title}</h1>
            <p className="mt-2 text-[16px] text-text-secondary">{t.claude.body}</p>
          </div>
          <ClaudeConnect mcpUrl={mcpUrl} />
          <div className="mt-auto flex flex-col gap-2">
            <Button onClick={next}>{t.claude.done}</Button>
            <Button variant="plain" onClick={next}>
              {t.common.later}
            </Button>
          </div>
        </div>
      ) : null}

      {STEPS[step] === "health" ? (
        <div className="flex flex-1 flex-col gap-5 pt-4">
          <h1 className="text-[30px] font-bold tracking-tight">{t.health.title}</h1>
          <HealthCheck
            data={health}
            onFinish={{ label: t.health.finish, action: () => startTransition(() => completeOnboardingAction()) }}
          />
        </div>
      ) : null}
    </div>
  );
}
