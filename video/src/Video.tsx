import { copy, type Lang } from "./copy";
import { Film, filmDuration, type Scene } from "./film";
import type { Copy } from "./copy";
import { Demo } from "./scenes/Demo";
import { Hook } from "./scenes/Hook";
import { Outro } from "./scenes/Outro";
import { Reveal } from "./scenes/Reveal";
import { Values } from "./scenes/Values";

export { FPS } from "./film";

/** The 30-second overview: 900 frames with the fades. */
export const PROMO: Scene<Copy>[] = [
  { component: Hook, frames: 225 },
  { component: Reveal, frames: 105 },
  { component: Demo, frames: 408 },
  { component: Values, frames: 96 },
  { component: Outro, frames: 114 },
];

export const DURATION = filmDuration(PROMO);

export function Video({ lang }: { lang: Lang }) {
  return <Film scenes={PROMO} c={copy[lang]} />;
}
