"use client";

import { IconColorPicker } from "@tabler/icons-react";
import { useEffect } from "react";
import { CheckCircle } from "@/components/tasks/check-circle";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import { ensureContrast } from "@/lib/theme/contrast";
import { ACCENTS, CARD_SURFACE } from "@/lib/theme/palette";
import { type Appearance, SURFACES, accentVars } from "@/lib/theme/tokens";

/** Applies an accent and appearance to the page right away, before saving. */
function preview(accent: string, appearance: Appearance) {
  const root = document.documentElement;
  const dark =
    appearance === "dark" || (appearance === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const mode = dark ? "dark" : "light";
  for (const [key, value] of Object.entries({ ...SURFACES[mode], ...accentVars(accent, mode) })) {
    root.style.setProperty(key, value);
  }
  root.style.colorScheme = mode;
}

export function AccentPicker({
  accent,
  appearance,
  onChange,
}: {
  accent: string;
  appearance: Appearance;
  onChange: (value: { accent?: string; appearance?: Appearance }) => void;
}) {
  const { t } = useI18n();
  useEffect(() => preview(accent, appearance), [accent, appearance]);

  const isPreset = ACCENTS.some((a) => a.light.toLowerCase() === accent.toLowerCase());
  const adjusted = ensureContrast(accent, CARD_SURFACE.light).adjusted;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl bg-card" aria-hidden>
        <div className="flex items-center gap-3 px-4 py-3">
          <ProgressRing done={2} total={5} size={32} />
          <div className="flex-1">
            <p className="text-[16px] font-semibold">{t.today.title}</p>
            <p className="text-[13px] text-text-secondary">{format(t.onboarding.previewDone, { done: 2, total: 5 })}</p>
          </div>
          <span className="text-[16px] font-semibold text-accent-text">14:00</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <CheckCircle checked label="" onToggle={() => {}} disabled />
          <span className="text-[16px] text-text-secondary line-through">Relire le devis Dupont</span>
        </div>
        <div className="flex items-center gap-3 px-4 pt-2.5 pb-3">
          <CheckCircle checked={false} label="" onToggle={() => {}} disabled />
          <span className="flex-1 text-[16px]">Répondre à Sarah</span>
          <span className="font-semibold text-accent-text">!!</span>
        </div>
      </div>

      <div role="radiogroup" aria-label={t.lists.color} className="grid grid-cols-6 justify-items-center gap-3">
        {ACCENTS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={preset.light.toLowerCase() === accent.toLowerCase()}
            aria-label={preset.id}
            onClick={() => onChange({ accent: preset.light })}
            className="size-10 rounded-full outline-offset-2 aria-checked:outline-[2.5px] aria-checked:outline-text"
            style={{ background: preset.light }}
          />
        ))}
        <label
          className={`relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-fill outline-offset-2 ${isPreset ? "" : "outline-[2.5px] outline-text"}`}
          style={isPreset ? undefined : { background: accent }}
        >
          <IconColorPicker size={18} stroke={1.8} aria-hidden className={isPreset ? "" : "text-on-accent"} />
          <span className="sr-only">{t.onboarding.customColor}</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => onChange({ accent: e.target.value.toUpperCase() })}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
      <p className="min-h-5 text-center text-[13px] text-text-secondary" aria-live="polite">
        {adjusted ? t.onboarding.adjusted : ""}
      </p>

      <div>
        <p className="px-1 pb-1.5 text-[13px] text-text-secondary">{t.onboarding.appearance}</p>
        <div role="radiogroup" aria-label={t.onboarding.appearance} className="flex rounded-[9px] bg-fill p-0.5">
          {(["light", "dark", "auto"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={appearance === mode}
              onClick={() => onChange({ appearance: mode })}
              className="flex-1 rounded-[7px] py-1.5 text-[14px] aria-checked:bg-card aria-checked:font-semibold"
            >
              {t.onboarding.appearances[mode]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
