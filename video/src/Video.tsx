import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { copy, type Lang } from "./copy";
import { Demo } from "./scenes/Demo";
import { LeadContext } from "./motion";
import { Hook } from "./scenes/Hook";
import { Outro } from "./scenes/Outro";
import { Reveal } from "./scenes/Reveal";
import { Values } from "./scenes/Values";
import { colors, font } from "./theme";

export const FPS = 30;

/** Scene lengths in frames. Fades overlap, so the total is their sum minus the transitions. */
export const SCENES = { hook: 225, reveal: 105, demo: 408, values: 96, outro: 114 } as const;
export const TRANSITION = 12;

const order = [Hook, Reveal, Demo, Values, Outro] as const;
const lengths = [SCENES.hook, SCENES.reveal, SCENES.demo, SCENES.values, SCENES.outro];

export const DURATION = lengths.reduce((a, b) => a + b, 0) - TRANSITION * (lengths.length - 1);

export function Video({ lang }: { lang: Lang }) {
  const c = copy[lang];
  return (
    <AbsoluteFill style={{ background: colors.bg, color: colors.text, fontFamily: font.text }}>
      <TransitionSeries>
      {order.map((Scene, i) => [
        <TransitionSeries.Sequence key={`scene-${i}`} durationInFrames={lengths[i]}>
          {/* Every scene after the first waits for the fade before it starts moving. */}
          <LeadContext.Provider value={i === 0 ? 0 : TRANSITION}>
            <Scene c={c} />
          </LeadContext.Provider>
        </TransitionSeries.Sequence>,
        i < order.length - 1 ? (
          <TransitionSeries.Transition key={`t-${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
        ) : null,
      ])}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
