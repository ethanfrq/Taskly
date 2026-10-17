import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { LogoParts } from "../brand/Logo";
import type { Copy } from "../copy";
import { progress, Rise, useSceneFrame } from "../motion";
import { colors, font } from "../theme";
import { Body, Display } from "../ui/text";

/** Logo, tagline, where to go. */
export function Outro({ c }: { c: Copy }) {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, frame), fps, config: { damping: 200 }, durationInFrames: 30 });
  const wipe = progress(frame, 8, 26);

  return (
    <AbsoluteFill style={{ background: colors.graphite, justifyContent: "center", alignItems: "center", color: colors.ivory }}>
      <LogoParts
        height={170}
        markStyle={{ opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }), transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])})`, transformOrigin: "50% 60%" }}
        wordStyle={{ clipPath: `inset(-5% ${(1 - wipe) * 100}% -5% 0)`, opacity: wipe > 0 ? 1 : 0 }}
      />
      <Rise at={34} duration={24} style={{ marginTop: 40, textAlign: "center" }}>
        <Display size={54} style={{ fontWeight: 600, color: colors.ivory }}>
          {c.outro.tagline}
        </Display>
      </Rise>
      <Rise at={52} duration={24} style={{ marginTop: 34 }}>
        <div style={{ fontFamily: font.display, fontSize: 44, fontWeight: 600, color: colors.accent, letterSpacing: "-0.01em" }}>{c.outro.url}</div>
      </Rise>
      <Rise at={66} duration={22} style={{ marginTop: 14 }}>
        <Body size={27}>{c.outro.small}</Body>
      </Rise>
      <Rise at={80} duration={20} style={{ position: "absolute", bottom: 54 }}>
        <Body size={18} style={{ opacity: 0.7 }}>
          {c.outro.disclaimer}
        </Body>
      </Rise>
    </AbsoluteFill>
  );
}
