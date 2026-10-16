import { describe, expect, it } from "vitest";
import {
  MIN_ACCENT_CONTRAST,
  contrastRatio,
  ensureContrast,
  hexToRgb,
  rgbToHex,
  textOnFill,
} from "./contrast";
import { ACCENTS, CARD_SURFACE } from "./palette";

describe("hexToRgb / rgbToHex", () => {
  it("round-trips a color", () => {
    expect(hexToRgb("#007aff")).toEqual([0, 122, 255]);
    expect(rgbToHex([0, 122, 255])).toBe("#007AFF");
  });

  it("accepts a color without the leading #", () => {
    expect(hexToRgb("FFCC00")).toEqual([255, 204, 0]);
  });

  it("rejects malformed colors", () => {
    expect(() => hexToRgb("#FFF")).toThrow(/Invalid hex color/);
    expect(() => hexToRgb("blue")).toThrow(/Invalid hex color/);
  });
});

describe("contrastRatio", () => {
  it("is 21 between black and white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("is 1 for identical colors", () => {
    expect(contrastRatio("#007AFF", "#007AFF")).toBe(1);
  });
});

describe("ensureContrast", () => {
  it("leaves iOS blue untouched on a white card", () => {
    expect(ensureContrast("#007AFF", CARD_SURFACE.light)).toEqual({
      color: "#007AFF",
      adjusted: false,
    });
  });

  it("darkens yellow on a white card until it is readable", () => {
    const result = ensureContrast("#FFCC00", CARD_SURFACE.light);
    expect(result.adjusted).toBe(true);
    expect(contrastRatio(result.color, CARD_SURFACE.light)).toBeGreaterThanOrEqual(
      MIN_ACCENT_CONTRAST,
    );
  });

  it("lightens a dark custom color on a dark card", () => {
    const result = ensureContrast("#3A0CA3", CARD_SURFACE.dark);
    expect(result.adjusted).toBe(true);
    expect(contrastRatio(result.color, CARD_SURFACE.dark)).toBeGreaterThanOrEqual(
      MIN_ACCENT_CONTRAST,
    );
  });

  it.each(ACCENTS.flatMap((a) => [
    [a.id, "light", a.light, CARD_SURFACE.light],
    [a.id, "dark", a.dark, CARD_SURFACE.dark],
  ] as const))("makes %s readable in %s mode", (_id, _mode, accent, surface) => {
    const { color } = ensureContrast(accent, surface);
    expect(contrastRatio(color, surface)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
  });
});

describe("textOnFill", () => {
  it("uses white on blue", () => {
    expect(textOnFill("#007AFF")).toBe("#FFFFFF");
  });

  it("switches to black on yellow", () => {
    expect(textOnFill("#FFCC00")).toBe("#000000");
  });
});
