import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { ComponentType } from "react";
import { AbsoluteFill } from "remotion";
import { LeadContext } from "./motion";
import { colors, font } from "./theme";

export const FPS = 30;
/** Frames of the fade between two scenes. */
export const TRANSITION = 12;

export type Scene<C> = { component: ComponentType<{ c: C }>; frames: number };

/** Total length of a film: the scenes, minus the fades that overlap them. */
export function filmDuration(scenes: { frames: number }[]) {
  return scenes.reduce((sum, s) => sum + s.frames, 0) - TRANSITION * (scenes.length - 1);
}

/** Scenes in a row, faded into one another; every scene after the first waits for its fade. */
export function Film<C>({ scenes, c }: { scenes: Scene<C>[]; c: C }) {
  return (
    <AbsoluteFill style={{ background: colors.bg, color: colors.text, fontFamily: font.text }}>
      <TransitionSeries>
        {scenes.map(({ component: SceneComponent, frames }, i) => [
          <TransitionSeries.Sequence key={`scene-${i}`} durationInFrames={frames}>
            <LeadContext.Provider value={i === 0 ? 0 : TRANSITION}>
              <SceneComponent c={c} />
            </LeadContext.Provider>
          </TransitionSeries.Sequence>,
          i < scenes.length - 1 ? (
            <TransitionSeries.Transition key={`t-${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
          ) : null,
        ])}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
