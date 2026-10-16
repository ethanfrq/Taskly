import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { LOCALE_COOKIE, type Locale, isLocale, negotiateLocale } from "./config";
import { en } from "./dictionaries/en";
import { fr, type Dictionary } from "./dictionaries/fr";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };

/** The visitor's locale: their saved choice, else their browser's language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return negotiateLocale((await headers()).get("accept-language"));
});

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
