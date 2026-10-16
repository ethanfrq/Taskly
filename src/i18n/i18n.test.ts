import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, negotiateLocale } from "./config";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { format, plural } from "./format";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("dictionaries", () => {
  it("have the same keys in French and English", () => {
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });

  it("have no empty strings", () => {
    for (const dict of [fr, en]) {
      const empty = keys(dict).filter((path) => {
        const value = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict);
        return typeof value === "string" && value.trim() === "";
      });
      expect(empty).toEqual([]);
    }
  });
});

describe("negotiateLocale", () => {
  it("falls back to the default without a header", () => {
    expect(negotiateLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it("picks the highest-ranked supported language", () => {
    expect(negotiateLocale("de-DE,de;q=0.9,en;q=0.8,fr;q=0.7")).toBe("en");
    expect(negotiateLocale("fr-CA,fr;q=0.9")).toBe("fr");
  });

  it("falls back when nothing is supported", () => {
    expect(negotiateLocale("ja,zh;q=0.8")).toBe(DEFAULT_LOCALE);
  });
});

describe("format and plural", () => {
  it("fills placeholders and keeps unknown ones", () => {
    expect(format("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });

  it("uses French plural rules (0 and 1 are singular)", () => {
    const forms = { one: "{count} tâche", other: "{count} tâches" };
    expect(plural("fr", 0, forms)).toBe("0 tâche");
    expect(plural("fr", 1, forms)).toBe("1 tâche");
    expect(plural("fr", 2, forms)).toBe("2 tâches");
  });

  it("uses English plural rules (0 is plural)", () => {
    const forms = { one: "{count} task", other: "{count} tasks" };
    expect(plural("en", 0, forms)).toBe("0 tasks");
    expect(plural("en", 1, forms)).toBe("1 task");
  });
});
