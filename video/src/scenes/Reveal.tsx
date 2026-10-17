import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { LogoParts } from "../brand/Logo";
import type { Copy } from "../copy";
import { progress, Rise, useSceneFrame } from "../motion";
import { colors } from "../theme";
import { Body, Display } from "../ui/text";

/** The logo lands: mark first, wordmark wiped in, then the tagline. */
export function Reveal({ c }: { c: Copy }) {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, frame), fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  const markOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const wipe = progress(frame, 14, 28);

  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", color: colors.ivory }}>
      <LogoParts
        height={210}
        markStyle={{ opacity: markOpacity, transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])}) rotate(${(1 - pop) * -10}deg)`, transformOrigin: "50% 60%" }}
        wordStyle={{ clipPath: `inset(-5% ${(1 - wipe) * 100}% -5% 0)`, transform: `translateX(${(1 - wipe) * -24}px)`, opacity: wipe > 0 ? 1 : 0 }}
      />
      <Rise at={46} duration={24} style={{ marginTop: 44, textAlign: "center" }}>
        <Display size={56} style={{ fontWeight: 600, color: colors.text }}>
          {c.reveal.tagline}
        </Display>
      </Rise>
      <Rise at={68} duration={22} style={{ marginTop: 18 }}>
        <Body size={30}>{c.reveal.sub}</Body>
      </Rise>
    </AbsoluteFill>
  );
}
