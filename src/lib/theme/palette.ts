/**
 * Accent colors offered during onboarding: the iOS system colors,
 * with their light and dark appearance variants.
 * See docs/design/README.md for the full token list.
 */
export type Accent = {
  id: string;
  light: string;
  dark: string;
};

export const ACCENTS = [
  { id: "blue", light: "#007AFF", dark: "#0A84FF" },
  { id: "indigo", light: "#5856D6", dark: "#5E5CE6" },
  { id: "purple", light: "#AF52DE", dark: "#BF5AF2" },
  { id: "pink", light: "#FF2D55", dark: "#FF375F" },
  { id: "red", light: "#FF3B30", dark: "#FF453A" },
  { id: "orange", light: "#FF9500", dark: "#FF9F0A" },
  { id: "yellow", light: "#FFCC00", dark: "#FFD60A" },
  { id: "green", light: "#34C759", dark: "#30D158" },
  { id: "mint", light: "#00C7BE", dark: "#63E6E2" },
  { id: "cyan", light: "#32ADE6", dark: "#64D2FF" },
  { id: "graphite", light: "#8E8E93", dark: "#98989D" },
] as const satisfies readonly Accent[];

export const DEFAULT_ACCENT = ACCENTS[0];

/** Card surfaces the accent text is drawn on, per appearance. */
export const CARD_SURFACE = {
  light: "#FFFFFF",
  dark: "#1C1C1E",
} as const;
