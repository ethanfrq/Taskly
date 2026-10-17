import { describe, expect, it } from "vitest";
import { claudeCameToday, claudePromptUrl } from "./claude-link";

describe("claude link", () => {
  it("puts the encoded sentence in claude.ai's message box", () => {
    expect(claudePromptUrl("Prépare ma journée dans Taskly")).toBe(
      "https://claude.ai/new?q=Pr%C3%A9pare%20ma%20journ%C3%A9e%20dans%20Taskly",
    );
    expect(claudePromptUrl("a & b?")).toBe("https://claude.ai/new?q=a%20%26%20b%3F");
  });

  it("counts a visit from the start of the user's day", () => {
    const start = new Date("2026-10-16T22:00:00Z");
    expect(claudeCameToday(null, start)).toBe(false);
    expect(claudeCameToday(new Date("2026-10-16T21:59:59Z"), start)).toBe(false);
    expect(claudeCameToday(start, start)).toBe(true);
  });
});
