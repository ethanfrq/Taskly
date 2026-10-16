"use client";

import { createContext, use, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/fr";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return <I18nContext value={{ locale, t: dictionary }}>{children}</I18nContext>;
}

/** Strings for Client Components. Server Components use getI18n() instead. */
export function useI18n() {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return value;
}
