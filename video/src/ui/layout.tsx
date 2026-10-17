import type { PropsWithChildren, ReactNode } from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { Rise, useLayout, useSceneFrame } from "../motion";
import { colors } from "../theme";
import { PHONE, PhoneFrame } from "./PhoneFrame";
import { Body, Display, Pill } from "./text";

/**
 * A title, a line under it, optional chips, and a phone: beside the copy in
 * landscape, under it (and larger) in portrait. The children are the screen.
 */
export function CopyAndPhone({
  title,
  sub,
  chips,
  titleAt = 6,
  subAt = 22,
  chipsAt = 38,
  titleSize,
  children,
}: PropsWithChildren<{
  title: string;
  sub?: string;
  chips?: ReactNode[];
  titleAt?: number;
  subAt?: number;
  chipsAt?: number;
  titleSize?: number;
}>) {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const { width, height, portrait, pad } = useLayout();
  const enter = spring({ frame: Math.max(0, frame), fps, config: { damping: 200 }, durationInFrames: 40 });
  const phoneScale = portrait ? 1.4 : 1;
  const phoneLeft = portrait ? (width - PHONE.width * phoneScale) / 2 : width - 260 - PHONE.width;
  const phoneTop = portrait ? 620 : (height - PHONE.height) / 2;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <div
        style={{
          position: "absolute",
          left: pad,
          width: portrait ? width - pad * 2 : 900,
          top: portrait ? 140 : 0,
          bottom: portrait ? undefined : 0,
          height: portrait ? 440 : undefined,
          display: "flex",
          flexDirection: "column",
          justifyContent: portrait ? "flex-start" : "center",
        }}
      >
        <Rise at={titleAt} duration={26}>
          <Display size={titleSize ?? (portrait ? 72 : 76)}>{title}</Display>
        </Rise>
        {sub ? (
          <Rise at={subAt} duration={24} style={{ marginTop: 26 }}>
            <Body size={portrait ? 36 : 38}>{sub}</Body>
          </Rise>
        ) : null}
        {chips && chips.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 32 }}>
            {chips.map((chip, i) => (
              <Rise key={i} at={chipsAt + i * 6} duration={22} distance={20}>
                <Pill size={27}>{chip}</Pill>
              </Rise>
            ))}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: phoneLeft,
          top: phoneTop,
          transform: `translateY(${(1 - enter) * 180}px) scale(${phoneScale})`,
          transformOrigin: "top left",
          opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </AbsoluteFill>
  );
}

/** A tap: a ring that expands and fades at a point of the screen, from `frame` 0. */
export function Tap({ frame, x, y }: { frame: number; x: number; y: number }) {
  if (frame < 0 || frame > 24) return null;
  const t = frame / 24;
  return (
    <div
      style={{
        position: "absolute",
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
        borderRadius: 999,
        border: `3px solid ${colors.accent}`,
        background: `rgba(10,132,255,${0.35 * (1 - t)})`,
        transform: `scale(${0.4 + t * 1.1})`,
        opacity: 1 - t,
        pointerEvents: "none",
        zIndex: 6,
      }}
    />
  );
}
