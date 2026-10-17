import { IconCalendarEvent, IconCheck, IconTrash } from "@tabler/icons-react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { progress } from "../../motion";
import { colors, font } from "../../theme";
import { Tap } from "../layout";
import { SCREEN } from "../PhoneFrame";
import { TabBar } from "../TabBar";

export type ReviewCopy = {
  date: string;
  title: string;
  doneText: string;
  doneLabel: string;
  left: string;
  tasks: string[];
  tomorrow: string;
  tomorrowLabel: string;
  plannedBefore: string;
  plannedAfter: string;
  moveAll: string;
  finish: string;
  finished: string;
};

/** The evening review: what's done, what's left, everything to tomorrow in one tap, then the day ends. */
export function ReviewScreen({
  c,
  frame,
  tabs,
  done,
  total,
  moveAllAt,
  finishAt,
}: {
  c: ReviewCopy;
  frame: number;
  tabs: string[];
  done: number;
  total: number;
  moveAllAt: number;
  finishAt: number;
}) {
  const { fps } = useVideoConfig();
  const circumference = 2 * Math.PI * 15;
  const ringIn = progress(frame, 6, 30);
  const moved = progress(frame, moveAllAt + 6, 1) === 1;
  const finished = frame >= finishAt + 6;
  const finishPop = spring({ frame: frame - finishAt - 6, fps, config: { damping: 12, stiffness: 180 } });
  const listH = c.tasks.length * 56;
  const listShrink = progress(frame, moveAllAt + 8, 22);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ padding: "58px 18px 0" }}>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>{c.date}</div>
        <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>{c.title}</div>

        <div style={{ background: colors.card, borderRadius: 16, padding: "16px", marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <svg width={60} height={60} viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", flex: "none" }}>
            <circle cx="18" cy="18" r="15" fill="none" stroke={colors.separator} strokeWidth="4" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(circumference * done * ringIn) / total} ${circumference}`} />
          </svg>
          <div>
            <div style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{c.doneText}</div>
            <div style={{ fontSize: 15, color: colors.textSecondary }}>{c.doneLabel}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: colors.textSecondary, padding: "18px 0 8px 16px", opacity: 1 - listShrink, height: 39 * (1 - listShrink), overflow: "hidden", boxSizing: "border-box" }}>{c.left}</div>
        <div style={{ background: colors.card, borderRadius: 16, overflow: "hidden", height: Math.max(0, listH * (1 - listShrink)), opacity: 1 - listShrink }}>
          {c.tasks.map((task, i) => (
            <div key={task} style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 12px 0 16px", borderTop: i === 0 ? "none" : `1px solid ${colors.separator}` }}>
              <div style={{ flex: 1, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task}</div>
              <span style={{ padding: "7px 12px", borderRadius: 999, background: colors.fill, color: colors.accent, fontSize: 15 }}>{c.tomorrow}</span>
              <span style={{ width: 34, height: 34, borderRadius: 999, background: colors.fill, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSecondary }}>
                <IconTrash size={16} stroke={1.8} />
              </span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: colors.textSecondary, padding: "18px 0 8px 16px" }}>{c.tomorrowLabel}</div>
        <div style={{ background: colors.card, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, fontSize: 17 }}>
          <IconCalendarEvent size={22} stroke={1.8} color={colors.accent} />
          {moved ? c.plannedAfter : c.plannedBefore}
        </div>
      </div>

      <div style={{ position: "absolute", left: 18, right: 18, bottom: 104 }}>
        <div style={{ background: colors.card, color: colors.accent, borderRadius: 14, padding: "15px 16px", textAlign: "center", fontSize: 17, opacity: moved ? 0.4 : 1 }}>{c.moveAll}</div>
        <div
          style={{
            marginTop: 10,
            background: colors.accent,
            color: colors.onAccent,
            borderRadius: 14,
            padding: "15px 16px",
            textAlign: "center",
            fontSize: 17,
            fontWeight: 600,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            transform: `scale(${finished ? interpolate(finishPop, [0, 1], [0.96, 1]) : 1})`,
          }}
        >
          {finished ? <IconCheck size={20} stroke={2.6} /> : null}
          {finished ? c.finished : c.finish}
        </div>
      </div>
      <Tap frame={frame - moveAllAt} x={SCREEN.width / 2} y={SCREEN.height - 104 - 84 - 8} />
      <Tap frame={frame - finishAt} x={SCREEN.width / 2} y={SCREEN.height - 104 - 26} />
      <TabBar labels={tabs} active={0} />
    </div>
  );
}
