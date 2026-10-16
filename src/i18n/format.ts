import type { Locale } from "./config";

/** Replaces {name} placeholders: format("Hi {name}", { name: "Sam" }) → "Hi Sam". */
export function format(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type PluralForms = { one: string; other: string };

/** Chooses the plural form for `count` and fills {count}. */
export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(count);
  return format(rule === "one" ? forms.one : forms.other, { count });
}
