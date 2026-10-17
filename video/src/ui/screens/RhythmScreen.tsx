import { IconClock, IconMoon, IconSun, IconZzz } from "@tabler/icons-react";
import { interpolate } from "remotion";
import { progress } from "../../motion";
import { colors, font } from "../../theme";
import { TabBar } from "../TabBar";

export type RhythmCopy = {
  settingsTitle: string;
  title: string;
  briefing: string;
  review: string;
  quietHours: string;
  insistence: string;
  discreet: string;
  insistent: string;
  level: string;
  priorityOnly: string;
  priorityOnlyHint: string;
  times: { briefing: string; review: string; quietFrom: string; quietTo: string };
};

const TimePill = ({ text, dim }: { text: string; dim?: boolean }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 10, background: colors.fill, fontSize: 16, color: dim ? colors.textSecondary : colors.text, fontVariantNumeric: "tabular-nums" }}>
    {text}
    <IconClock size={15} stroke={1.8} />
  </span>
);

/** Settings › Your rhythm: briefing, review, quiet hours and the insistence slider, as in the app. */
export function RhythmScreen({
  c,
  frame,
  tabs,
  highlightAt,
  toast,
}: {
  c: RhythmCopy;
  frame: number;
  tabs: string[];
  /** When the quiet-hours row gets its accent ring. */
  highlightAt?: number;
  toast?: { at: number; text: string };
}) {
  const ring = highlightAt === undefined ? 0 : progress(frame, highlightAt, 16);
  const toastIn = toast ? progress(frame, toast.at, 18) : 0;
  const row = (icon: React.ReactNode, label: string, right: React.ReactNode, last?: boolean, extra?: React.CSSProperties) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: last ? "none" : `1px solid ${colors.separator}`, ...extra }}>
      <span style={{ color: colors.accent, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 17 }}>{label}</span>
      {right}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ padding: "58px 18px 0" }}>
        <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>{c.settingsTitle}</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, padding: "20px 0 8px 16px" }}>{c.title}</div>
        <div style={{ background: colors.card, borderRadius: 16, overflow: "hidden" }}>
          {row(<IconSun size={22} stroke={1.8} />, c.briefing, <TimePill text={c.times.briefing} />)}
          {row(<IconMoon size={22} stroke={1.8} />, c.review, <TimePill text={c.times.review} />)}
          {row(
            <IconZzz size={22} stroke={1.8} />,
            c.quietHours,
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <TimePill text={c.times.quietFrom} dim />
              <span style={{ color: colors.textSecondary }}>–</span>
              <TimePill text={c.times.quietTo} dim />
            </span>,
            true,
            { boxShadow: `inset 0 0 0 ${2 * ring}px ${colors.accent}`, background: `rgba(10,132,255,${0.12 * ring})`, borderRadius: ring ? 0 : undefined },
          )}
        </div>

        <div style={{ fontSize: 13, color: colors.textSecondary, padding: "20px 0 8px 16px" }}>{c.insistence}</div>
        <div style={{ background: colors.card, borderRadius: 16, padding: "18px 16px 16px" }}>
          <div style={{ position: "relative", height: 6, borderRadius: 3, background: colors.separator }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "33%", borderRadius: 3, background: colors.accent }} />
            <div style={{ position: "absolute", left: "33%", top: "50%", width: 24, height: 24, borderRadius: 999, background: colors.accent, transform: "translate(-50%, -50%)", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 14, color: colors.textSecondary }}>
            <span>{c.discreet}</span>
            <span>{c.insistent}</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 16 }}>{c.level}</div>
        </div>

        <div style={{ background: colors.card, borderRadius: 16, padding: "14px 16px", marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17 }}>{c.priorityOnly}</div>
            <div style={{ fontSize: 14, color: colors.textSecondary }}>{c.priorityOnlyHint}</div>
          </div>
          <div style={{ width: 51, height: 31, borderRadius: 999, background: "#34c759", position: "relative", flex: "none" }}>
            <div style={{ position: "absolute", top: 2, right: 2, width: 27, height: 27, borderRadius: 999, background: "#fff" }} />
          </div>
        </div>
      </div>

      {toast ? (
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 108,
            padding: "12px 16px",
            borderRadius: 16,
            background: "rgba(44,44,46,0.96)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 15,
            opacity: toastIn,
            transform: `translateY(${interpolate(toastIn, [0, 1], [24, 0])}px)`,
          }}
        >
          <IconMoon size={20} stroke={1.8} color={colors.accent} />
          {toast.text}
        </div>
      ) : null}
      <TabBar labels={tabs} active={3} />
    </div>
  );
}
