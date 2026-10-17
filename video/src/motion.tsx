import { createContext, useContext, type CSSProperties, type PropsWithChildren } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "./theme";

/**
 * Frames a scene waits before its own timeline starts, so nothing enters while
 * the previous scene is still fading out. Video.tsx sets it to the transition length.
 */
export const LeadContext = createContext(0);

/**
 * Landscape (1920×1080) or portrait (1080×1920), from the composition's size.
 * `pad` is the side gutter; portrait text is read on a phone, so it gets more room.
 */
export function useLayout() {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return { width, height, portrait, pad: portrait ? 80 : 160 };
}

/** The scene's frame: 0 once the fade from the previous scene is over. */
export function useSceneFrame() {
  return useCurrentFrame() - useContext(LeadContext);
}

/** 0 → 1 between `start` and `start + duration`, with the brand easing. */
export function progress(frame: number, start: number, duration: number, easing = ease) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

/** Fade and slide up into place from `at`, and optionally leave at `until`. */
export function Rise({
  at,
  until,
  duration = 26,
  distance = 28,
  style,
  children,
}: PropsWithChildren<{ at: number; until?: number; duration?: number; distance?: number; style?: CSSProperties }>) {
  const frame = useSceneFrame();
  const t = progress(frame, at, duration);
  const out = until === undefined ? 0 : progress(frame, until, 12);
  return (
    <div
      style={{
        opacity: t * (1 - out),
        transform: `translateY(${(1 - t) * distance - out * 16}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
