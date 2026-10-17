import { AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig } from "remotion";
import type { Copy } from "../copy";
import { progress, Rise, useLayout, useSceneFrame } from "../motion";
import { colors, font } from "../theme";
import { SourceIcon } from "../ui/SourceIcon";
import { Body, Display } from "../ui/text";

/** Beats, in frames from the scene start. */
export const HOOK = {
  counts: [10, 32, 54],
  punch: 72,
  cardsFrom: 100,
  cardEvery: 5,
  veil: 162,
  line1: 168,
  line2: 182,
  toBlack: 213,
} as const;

/**
 * The hook: this morning's pile, counted up, and no list to hold it. Then the
 * notifications themselves fly in and bury the words.
 */
export function Hook({ c }: { c: Copy }) {
  const frame = useSceneFrame();
  const { fps } = useVideoConfig();
  const { width, height, portrait, pad } = useLayout();
  // Portrait is watched on a phone: the notifications grow so their text stays readable.
  const cs = portrait ? 1.5 : 1;
  const veil = progress(frame, HOOK.veil, 16);
  const toBlack = progress(frame, HOOK.toBlack, 12);

  return (
    <AbsoluteFill style={{ background: colors.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${pad}px` }}>
        <Rise at={0} duration={20}>
          <Body size={portrait ? 38 : 34} style={{ marginBottom: 18 }}>{c.hook.eyebrow}</Body>
        </Rise>
        {c.hook.counts.map((count, i) => {
          const at = HOOK.counts[i];
          const n = Math.round(count.n * progress(frame, at, 24, Easing.out(Easing.cubic)));
          return (
            <Rise key={count.label} at={at} duration={22} distance={36} style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
              <Display size={150} style={{ fontVariantNumeric: "tabular-nums", minWidth: 250 }}>
                {n}
              </Display>
              <Display size={72} style={{ color: colors.textSecondary, fontWeight: 500 }}>
                {count.label}
              </Display>
            </Rise>
          );
        })}
        <Rise at={HOOK.punch} duration={22} distance={40} style={{ marginTop: 26 }}>
          <Display size={112} style={{ color: colors.accent }}>
            {c.hook.punch}
          </Display>
        </Rise>
      </AbsoluteFill>

      {c.chaos.cards.map((card, i) => {
        const at = HOOK.cardsFrom + i * HOOK.cardEvery;
        const s = spring({ frame: Math.max(0, frame - at), fps, config: { damping: 15, stiffness: 120, mass: 1 } });
        const rx = (random(`x-${i}`) - 0.5) * 2;
        const ry = (random(`y-${i}`) - 0.5) * 2;
        const endX = width / 2 + rx * (portrait ? 300 : 440);
        const endY = height / 2 + ry * (portrait ? 560 : 280);
        const rot = (random(`r-${i}`) - 0.5) * 26;
        const side = i % 4;
        const startX = side === 1 ? width + 500 : side === 3 ? -700 : endX + rx * 300;
        const startY = side === 0 ? -500 : side === 2 ? height + 500 : endY + ry * 200;
        const x = interpolate(s, [0, 1], [startX, endX]);
        const y = interpolate(s, [0, 1], [startY, endY]);
        const scale = interpolate(s, [0, 1], [0.85, 1]) * cs;
        return (
          <div
            key={`${card.kind}-${i}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 460,
              transform: `translate(${x - 230}px, ${y - 58}px) rotate(${rot * s}deg) scale(${scale})`,
              opacity: frame < at ? 0 : 1,
              zIndex: 10 + i,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 20px",
              borderRadius: 22,
              background: colors.card,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
              fontFamily: font.text,
              color: colors.text,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: colors.fill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <SourceIcon kind={card.kind} size={26} stroke={1.7} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 23, fontWeight: 600 }}>{card.from}</div>
                <div style={{ fontSize: 15, color: colors.textSecondary }}>{card.when}</div>
              </div>
              <div style={{ fontSize: 20, color: colors.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.text}</div>
            </div>
          </div>
        );
      })}

      <AbsoluteFill style={{ background: `rgba(0,0,0,${0.62 * veil})`, zIndex: 100 }} />
      <AbsoluteFill style={{ zIndex: 101, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <Line at={HOOK.line1} size={portrait ? 96 : 104}>{c.chaos.line1}</Line>
        <Line at={HOOK.line2} size={portrait ? 96 : 104} style={{ color: colors.textSecondary }}>
          {c.chaos.line2}
        </Line>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: colors.bg, opacity: toBlack, zIndex: 102 }} />
    </AbsoluteFill>
  );
}

function Line({ at, size, style, children }: { at: number; size: number; style?: React.CSSProperties; children: React.ReactNode }) {
  const frame = useSceneFrame();
  const t = progress(frame, at, 20);
  return (
    <Display size={size} style={{ opacity: t, transform: `translateY(${(1 - t) * 30}px) scale(${0.96 + 0.04 * t})`, textShadow: "0 10px 60px rgba(0,0,0,0.8)", ...style }}>
      {children}
    </Display>
  );
}
