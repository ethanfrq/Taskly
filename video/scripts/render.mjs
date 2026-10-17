// Renders every film in its four versions (FR, EN, landscape, portrait) straight into site/assets/.
// Usage: node scripts/render.mjs            # all films
//        node scripts/render.mjs reminders  # one or more of: promo reminders privacy day
import { spawnSync } from "node:child_process";
import path from "node:path";

const FILMS = {
  promo: { composition: "TasklyPromo", file: "taskly-30s" },
  reminders: { composition: "TasklyReminders", file: "taskly-reminders" },
  privacy: { composition: "TasklyPrivacy", file: "taskly-privacy" },
  day: { composition: "TasklyDay", file: "taskly-day" },
};

const wanted = process.argv.slice(2);
const films = wanted.length ? wanted : Object.keys(FILMS);
const outDir = path.resolve("../site/assets");

for (const name of films) {
  const film = FILMS[name];
  if (!film) {
    console.error(`Unknown film "${name}". Films: ${Object.keys(FILMS).join(", ")}`);
    process.exit(1);
  }
  for (const lang of ["fr", "en"]) {
    for (const vertical of [false, true]) {
      const id = `${film.composition}${lang.toUpperCase()}${vertical ? "-Vertical" : ""}`;
      const out = path.join(outDir, `${film.file}-${lang}${vertical ? "-vertical" : ""}.mp4`);
      console.log(`→ ${id} → ${path.relative(process.cwd(), out)}`);
      const result = spawnSync("npx", ["remotion", "render", id, out, "--log=error"], { stdio: "inherit" });
      if (result.status !== 0) process.exit(result.status ?? 1);
    }
  }
}
