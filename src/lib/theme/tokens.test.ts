import { describe, expect, it } from "vitest";
import { accentVars, themeCss } from "./tokens";

describe("accentVars", () => {
  it("uses the iOS dark variant of a preset in dark mode", () => {
    expect(accentVars("#007AFF", "dark")["--accent"]).toBe("#0A84FF");
  });

  it("darkens yellow text on light cards and puts black text on the fill", () => {
    const vars = accentVars("#FFCC00", "light");
    expect(vars["--accent"]).toBe("#FFCC00");
    expect(vars["--accent-text"]).not.toBe("#FFCC00");
    expect(vars["--on-accent"]).toBe("#000000");
  });
});

describe("themeCss", () => {
  it("forces one scheme or follows the system", () => {
    expect(themeCss("#007AFF", "dark")).not.toContain("@media");
    expect(themeCss("#007AFF", "dark")).toContain("color-scheme:dark");
    expect(themeCss("#007AFF", "auto")).toContain("@media (prefers-color-scheme: dark)");
  });

  it("only emits safe characters from a stored accent", () => {
    expect(() => themeCss("red;}body{display:none", "auto")).toThrow(/Invalid hex color/);
  });
});
