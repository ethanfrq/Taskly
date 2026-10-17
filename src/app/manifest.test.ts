import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";

/** Width and height from a PNG's IHDR chunk. */
function pngSize(path: string) {
  const bytes = readFileSync(path);
  return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
}

describe("web app manifest", () => {
  const icons = manifest().icons ?? [];

  it("points every icon to a PNG of the declared size", () => {
    for (const icon of icons) expect(pngSize(`public${icon.src}`), icon.src).toBe(icon.sizes);
  });

  it("has a 1024 maskable icon for Safari's Add to Dock", () => {
    expect(icons).toContainEqual(expect.objectContaining({ sizes: "1024x1024", purpose: "maskable" }));
  });
});
