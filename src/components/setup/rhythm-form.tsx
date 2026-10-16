"use client";

import { IconMoon, IconSun, IconZzz } from "@tabler/icons-react";
import { useI18n } from "@/i18n/client";

export type Rhythm = {
  briefingTime: string;
  reviewTime: string;
  quietStart: string;
  quietEnd: string;
  insistence: number;
  followUpPriorityOnly: boolean;
};

const timeInput =
  "rounded-[7px] bg-fill px-2 py-1 text-[15px] tabular-nums outline-none focus:ring-2 focus:ring-accent";

/** Briefing and review times, quiet hours, reminder insistence (D-007). */
export function RhythmForm({ value, onChange }: { value: Rhythm; onChange: (patch: Partial<Rhythm>) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <div className="divide-y divide-separator overflow-hidden rounded-xl bg-card">
        <label className="flex items-center gap-3 px-4 py-3">
          <IconSun size={20} stroke={1.8} className="text-accent-text" aria-hidden />
          <span className="flex-1 text-[16px]">{t.rhythm.briefing}</span>
          <input type="time" value={value.briefingTime} onChange={(e) => e.target.value && onChange({ briefingTime: e.target.value })} className={timeInput} />
        </label>
        <label className="flex items-center gap-3 px-4 py-3">
          <IconMoon size={20} stroke={1.8} className="text-accent-text" aria-hidden />
          <span className="flex-1 text-[16px]">{t.rhythm.review}</span>
          <input type="time" value={value.reviewTime} onChange={(e) => e.target.value && onChange({ reviewTime: e.target.value })} className={timeInput} />
        </label>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <IconZzz size={20} stroke={1.8} className="text-accent-text" aria-hidden />
          <span className="flex-1 text-[16px]">{t.rhythm.quietHours}</span>
          <span className="flex items-center gap-1.5 text-[14px] text-text-secondary">
            <label className="sr-only" htmlFor="quiet-start">
              {t.rhythm.quietFrom}
            </label>
            <input id="quiet-start" type="time" value={value.quietStart} onChange={(e) => e.target.value && onChange({ quietStart: e.target.value })} className={timeInput} />
            –
            <label className="sr-only" htmlFor="quiet-end">
              {t.rhythm.quietTo}
            </label>
            <input id="quiet-end" type="time" value={value.quietEnd} onChange={(e) => e.target.value && onChange({ quietEnd: e.target.value })} className={timeInput} />
          </span>
        </div>
      </div>

      <div>
        <p className="px-4 pb-1.5 text-[13px] text-text-secondary" id="insistence-label">
          {t.rhythm.insistence}
        </p>
        <div className="rounded-xl bg-card px-4 py-3">
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={value.insistence}
            aria-labelledby="insistence-label"
            aria-valuetext={t.rhythm.levels[value.insistence - 1]}
            onChange={(e) => onChange({ insistence: Number(e.target.value) })}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[12px] text-text-secondary">
            <span>{t.rhythm.discreet}</span>
            <span>{t.rhythm.insistent}</span>
          </div>
          <p className="mt-2 min-h-10 text-[15px]">
            {value.insistence} · {t.rhythm.levels[value.insistence - 1]}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
        <span className="flex-1">
          <span className="block text-[16px]">{t.rhythm.priorityOnly}</span>
          <span className="block text-[13px] text-text-secondary">{t.rhythm.priorityOnlyHint}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={value.followUpPriorityOnly}
          onChange={(e) => onChange({ followUpPriorityOnly: e.target.checked })}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill transition-colors peer-checked:bg-[#34C759] peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:top-[2px] after:left-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>
    </div>
  );
}
