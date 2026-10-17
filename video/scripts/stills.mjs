// Renders a handful of frames as PNGs, to check the design without a full render.
// Usage: node scripts/stills.mjs TasklyPromoFR 30 100 354 > out/stills/
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [id = "TasklyPromoFR", ...frameArgs] = process.argv.slice(2);
const frames = frameArgs.length ? frameArgs.map(Number) : [30, 100, 153, 188, 241, 301, 354, 454, 574, 654, 762, 886];
const outDir = path.resolve("out/stills", id);
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, imageFormat: "png" });
  console.log(output);
}
