"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";
import { useI18n } from "@/i18n/client";
import { LOCALES, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = { fr: "Français", en: "English" };

/** iOS-style segmented control to switch the interface language. */
export function LanguageSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="radiogroup"
      aria-label={t.common.language}
      aria-busy={pending}
      className="mx-auto flex w-56 rounded-[9px] bg-fill p-0.5"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === locale}
          lang={option}
          onClick={() =>
            startTransition(async () => {
              await setLocale(option);
              router.refresh();
            })
          }
          className="flex-1 rounded-[7px] py-1.5 text-sm aria-checked:bg-card aria-checked:font-medium"
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}
