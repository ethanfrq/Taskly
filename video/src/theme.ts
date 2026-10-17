import { Easing } from "remotion";

/**
 * The app's dark-mode tokens (src/app/globals.css) and the brand colors
 * (docs/brand/README.md). The video is a Taskly screen, so it uses nothing else.
 */
export const colors = {
  bg: "#000000",
  card: "#1c1c1e",
  fill: "#2c2c2e",
  separator: "#38383a",
  text: "#ffffff",
  textSecondary: "#98989d",
  accent: "#0a84ff",
  onAccent: "#ffffff",
  graphite: "#171717",
  ivory: "#f5f3ed",
} as const;

export const font = {
  display:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;

/** The landing page's easing (`--ease`), used for every entrance. */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Spring without overshoot, for the Apple-like settles. */
export const SMOOTH = { damping: 200 } as const;
