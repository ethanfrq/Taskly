import { IconCheck, IconSparkles } from "@tabler/icons-react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import type { Copy } from "../copy";
import { progress, Rise, useSceneFrame } from "../motion";
import { colors } from "../theme";
import { Phone, PHONE, type PhoneTimeline } from "../ui/Phone";
import { SourceIcon } from "../ui/SourceIcon";
import { Body, Display, Pill } from "../ui/text";

/** Beats of the demo, in frames from the scene start. */
export const DEMO = {
  beatB: 90,
  beatC: 205,
  beatD: 305,
  typing: { start: 24, end: 68 },
  sentAt: 76,
} as const;

const PHONE_T: PhoneTimeline = {
  bannerAt: 94,
  tasksAt: [106, 124, 142],
  ticksAt: [218, 250],
  notifAt: 316,
};

const LEFT = { x: 160, width: 900 } as const;

/** One prompt, Claude fills the list, reminders ring: the phone stays while the copy changes. */
export function Demo({ c }: { c: Copy }) {
  const frame = useSceneFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = spring({ frame: Math.max(0, frame), fps, config: { damping: 200 }, durationInFrames: 40 });
  const wobbleT = frame - PHONE_T.notifAt - 2;
  const wobble = wobbleT > 0 && wobbleT < 16 ? Math.sin(wobbleT * 2.1) * 6 * (1 - wobbleT / 16) : 0;

  const typed = progress(frame, DEMO.typing.start, DEMO.typing.end - DEMO.typing.start, (t) => t);
  const chars = Math.round(c.demo.a.prompt.length * typed);
  const cursorOn = frame < DEMO.sentAt && frame % 16 < 9;
  const sent = progress(frame, DEMO.sentAt, 12);

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {/* Left column */}
      <div style={{ position: "absolute", left: LEFT.x, width: LEFT.width, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Beat A */}
        <Beat from={0} to={DEMO.beatB}>
          <Rise at={8} duration={26}>
            <Display size={78}>{c.demo.a.title}</Display>
          </Rise>
          <Rise at={24} duration={24} style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 22 }}>
            <Pill size={34} style={{ padding: "20px 30px", gap: 16 }}>
              <IconSparkles size={36} stroke={1.8} color={colors.accent} />
              <span>
                {c.demo.a.prompt.slice(0, chars)}
                <span style={{ display: "inline-block", width: 3, height: 36, background: colors.accent, verticalAlign: -6, marginLeft: 3, opacity: cursorOn ? 1 : 0 }} />
              </span>
            </Pill>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.accent, fontSize: 28, fontWeight: 600, opacity: sent, transform: `translateX(${(1 - sent) * -10}px)` }}>
              <IconCheck size={30} stroke={2.4} />
              {c.demo.a.sent}
            </div>
          </Rise>
        </Beat>

        {/* Beat B */}
        <Beat from={DEMO.beatB} to={DEMO.beatC}>
          <Rise at={DEMO.beatB + 2} duration={26}>
            <Display size={72}>{c.demo.b.title}</Display>
          </Rise>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 36, maxWidth: 860 }}>
            {c.demo.b.sources.map((s, i) => (
              <Rise key={s.kind} at={DEMO.beatB + 18 + i * 6} duration={22} distance={20}>
                <Pill size={27} style={{ color: colors.text }}>
                  <SourceIcon kind={s.kind} size={28} stroke={1.7} />
                  {s.label}
                </Pill>
              </Rise>
            ))}
          </div>
        </Beat>

        {/* Beat C */}
        <Beat from={DEMO.beatC} to={DEMO.beatD}>
          <Rise at={DEMO.beatC + 2} duration={26}>
            <Display size={78}>{c.demo.c.title}</Display>
          </Rise>
          <Rise at={DEMO.beatC + 18} duration={24} style={{ marginTop: 28 }}>
            <Body size={38}>{c.demo.c.sub}</Body>
          </Rise>
        </Beat>

        {/* Beat D */}
        <Beat from={DEMO.beatD}>
          <Rise at={DEMO.beatD + 2} duration={26}>
            <Display size={78}>{c.demo.d.title}</Display>
          </Rise>
          <Rise at={DEMO.beatD + 18} duration={24} style={{ marginTop: 28 }}>
            <Body size={38}>{c.demo.d.sub}</Body>
          </Rise>
        </Beat>
      </div>

      {/* Phone */}
      <div
        style={{
          position: "absolute",
          left: width - 260 - PHONE.width,
          top: (height - PHONE.height) / 2,
          transform: `translate(${wobble}px, ${(1 - enter) * 180}px)`,
          opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Phone copy={c.phone} frame={frame} t={PHONE_T} />
      </div>
    </AbsoluteFill>
  );
}

/** Shows its children between two beats, fading out before the next one. */
function Beat({ from, to, children }: { from: number; to?: number; children: React.ReactNode }) {
  const frame = useSceneFrame();
  if (frame < from || (to !== undefined && frame >= to)) return null;
  const out = to === undefined ? 0 : progress(frame, to - 12, 12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, opacity: 1 - out, transform: `translateY(${out * -18}px)` }}>
      {children}
    </div>
  );
}
