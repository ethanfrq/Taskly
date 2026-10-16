/**
 * Contrast guard for user-picked accent colors (design decision D-002).
 *
 * Fills keep the raw accent. Text and icons drawn in the accent are pushed
 * towards black (light mode) or white (dark mode) until they reach a minimum
 * contrast ratio against the surface they sit on.
 */

type Rgb = readonly [number, number, number];

const toRgb = (values: number[]): Rgb => [values[0], values[1], values[2]];

/** Minimum contrast for accent-colored text and icons on a card. */
export const MIN_ACCENT_CONTRAST = 3;

/** Below this ratio, white text on an accent fill switches to black. */
const MIN_WHITE_ON_FILL_CONTRAST = 2;

/** Fraction of the remaining distance to black or white covered per step. */
const STEP = 0.06;
const MAX_STEPS = 60;

const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

export function hexToRgb(hex: string): Rgb {
  const match = HEX_COLOR.exec(hex.trim());
  if (!match) {
    throw new Error(`Invalid hex color: "${hex}". Expected #RRGGBB.`);
  }
  const value = match[1];
  return toRgb([0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)));
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export type AdjustedColor = {
  /** The color to use for text and icons, as #RRGGBB. */
  color: string;
  /** Whether the input had to be changed to reach the minimum contrast. */
  adjusted: boolean;
};

/**
 * Returns a version of `accent` readable on `surface`. The color is moved
 * towards black on light surfaces and towards white on dark ones.
 */
export function ensureContrast(
  accent: string,
  surface: string,
  minRatio: number = MIN_ACCENT_CONTRAST,
): AdjustedColor {
  const surfaceRgb = hexToRgb(surface);
  const target: Rgb = relativeLuminance(surfaceRgb) > 0.5 ? [0, 0, 0] : [255, 255, 255];

  let rgb = hexToRgb(accent);
  let steps = 0;
  while (contrastRatio(rgbToHex(rgb), surface) < minRatio && steps < MAX_STEPS) {
    rgb = toRgb(rgb.map((v, i) => Math.round(v + (target[i] - v) * STEP)));
    steps++;
  }

  return { color: rgbToHex(rgb), adjusted: steps > 0 };
}

/** Text color to put on an accent fill (buttons, checked boxes). */
export function textOnFill(fill: string): "#FFFFFF" | "#000000" {
  return contrastRatio(fill, "#FFFFFF") >= MIN_WHITE_ON_FILL_CONTRAST ? "#FFFFFF" : "#000000";
}
