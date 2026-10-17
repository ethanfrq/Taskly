import { IconFlame, IconSparkles } from "@tabler/icons-react";
import { Easing } from "remotion";
import { progress } from "../../motion";
import { colors, font } from "../../theme";
import { TabBar } from "../TabBar";

export type StatsCopy = {
  title: string;
  doneLabel: string;
  streakLabel: string;
  streakValue: string;
  completionLabel: string;
  focusLabel: string;
  focusValue: string;
  perDay: string;
  bestDay: string;
  fromClaude: string;
  topLists: string;
  lists: [string, number][];
  days: string[];
};

const tile: React.CSSProperties = { background: colors.card, borderRadius: 16, padding: "16px 16px 18px", flex: 1 };
const label: React.CSSProperties = { fontSize: 15, color: colors.textSecondary };
const value: React.CSSProperties = { fontFamily: font.display, fontSize: 30, fontWeight: 700, marginTop: 10, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 6 };

/** Your week: four tiles counting up, the bars of the last seven days, and what Claude helped with. */
export function StatsScreen({ c, frame, tabs, done, completion, bars }: { c: StatsCopy; frame: number; tabs: string[]; done: number; completion: number; bars: number[] }) {
  const up = progress(frame, 8, 36, Easing.out(Easing.cubic));
  const max = Math.max(...bars, 1);
  const today = bars.length - 1;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ padding: "58px 18px 0" }}>
        <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>{c.title}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <div style={tile}>
            <div style={label}>{c.doneLabel}</div>
            <div style={value}>{Math.round(done * up)}</div>
          </div>
          <div style={tile}>
            <div style={label}>{c.streakLabel}</div>
            <div style={value}>
              <IconFlame size={24} stroke={1.8} color="#ff9f0a" />
              {c.streakValue}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={tile}>
            <div style={label}>{c.completionLabel}</div>
            <div style={value}>{Math.round(completion * up)} %</div>
          </div>
          <div style={tile}>
            <div style={label}>{c.focusLabel}</div>
            <div style={value}>{c.focusValue}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: colors.textSecondary, padding: "18px 0 8px 16px" }}>{c.perDay}</div>
        <div style={{ background: colors.card, borderRadius: 16, padding: "16px 16px 12px", height: 170, display: "flex", alignItems: "flex-end", gap: 10 }}>
          {bars.map((v, i) => {
            const grow = progress(frame, 20 + i * 4, 26);
            const h = Math.max(4, (v / max) * 96 * grow);
            return (
              <div key={c.days[i] + i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 12, color: colors.textSecondary, opacity: grow }}>{v || ""}</div>
                <div style={{ width: "100%", height: h, borderRadius: 8, background: i === today ? colors.accent : "rgba(10,132,255,0.35)" }} />
                <div style={{ fontSize: 13, color: i === today ? colors.accent : colors.textSecondary }}>{c.days[i]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 14, color: colors.textSecondary, padding: "10px 0 0 16px" }}>{c.bestDay}</div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(10,132,255,0.16)", fontSize: 15 }}>
          <IconSparkles size={20} stroke={1.8} color={colors.accent} />
          {c.fromClaude}
        </div>
      </div>
      <TabBar labels={tabs} active={0} />
    </div>
  );
}
