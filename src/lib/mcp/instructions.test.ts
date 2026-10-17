import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { fr } from "@/i18n/dictionaries/fr";
import { INSTRUCTIONS } from "./server";

describe("MCP instructions", () => {
  // Today's "Prepare my day" button sends these sentences to Claude: the instructions must name them.
  it("answer the sentences Today's Claude button sends", () => {
    for (const t of [en, fr]) {
      expect(INSTRUCTIONS).toContain(`"${t.today.preparePrompt}"`);
      expect(INSTRUCTIONS).toContain(`"${t.today.refreshPrompt}"`);
    }
  });
});
