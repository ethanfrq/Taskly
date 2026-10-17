import { ensureContrast, textOnFill } from "./contrast";
import { ACCENTS, CARD_SURFACE } from "./palette";

/** Surface, text and semantic color tokens, kept in sync with src/app/globals.css. */
export const SURFACES = {
  light: {
    "--bg": "#f2f2f7",
    "--card": "#ffffff",
    "--text": "#000000",
    "--text-secondary": "#6e6e73",
    "--separator": "#e5e5ea",
    "--fill": "#e3e3e8",
    "--danger": "#ff3b30",
    "--success": "#34c759",
    "--warning": "#ff9500",
  },
  dark: {
    "--bg": "#000000",
    "--card": "#1c1c1e",
    "--text": "#ffffff",
    "--text-secondary": "#98989d",
    "--separator": "#38383a",
    "--fill": "#2c2c2e",
    "--danger": "#ff453a",
    "--success": "#30d158",
    "--warning": "#ff9f0a",
  },
} as const;

export type Appearance = "light" | "dark" | "auto";

/** The accent variables for one appearance (D-002: readable text, raw fills). */
export function accentVars(accent: string, mode: "light" | "dark") {
  const preset = ACCENTS.find((a) => a.light.toLowerCase() === accent.toLowerCase());
  const fill = mode === "dark" && preset ? preset.dark : accent;
  return {
    "--accent": fill,
    "--accent-text": ensureContrast(fill, CARD_SURFACE[mode]).color,
    "--on-accent": textOnFill(fill),
  };
}

const block = (vars: Record<string, string>, scheme: "light" | "dark") =>
  `${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")};color-scheme:${scheme}`;

/** CSS that applies a user's accent and appearance on top of the defaults. */
export function themeCss(accent: string, appearance: Appearance): string {
  const light = block({ ...SURFACES.light, ...accentVars(accent, "light") }, "light");
  const dark = block({ ...SURFACES.dark, ...accentVars(accent, "dark") }, "dark");
  if (appearance === "light") return `:root{${light}}`;
  if (appearance === "dark") return `:root{${dark}}`;
  return `:root{${light}}@media (prefers-color-scheme: dark){:root{${dark}}}`;
}
