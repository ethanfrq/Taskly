import { IconCalendarEvent, IconChartBar, IconCheck, IconCirclePlus, IconGripVertical, IconSparkles, IconTarget } from "@tabler/icons-react";
import { spring, useVideoConfig } from "remotion";
import type { Copy } from "../copy";
import { progress } from "../motion";
import { colors, font } from "../theme";
import { DropIn, NotificationCard } from "./NotificationCard";
import { PhoneFrame } from "./PhoneFrame";
import { SourceIcon } from "./SourceIcon";
import { TabBar } from "./TabBar";

export { PHONE } from "./PhoneFrame";

export type PhoneTimeline = {
  bannerAt: number;
  tasksAt: number[];
  ticksAt: number[];
  notifAt: number;
};

/** The Today screen (design D-001), redrawn with the app's tokens and animated by frame. */
export function Phone({ copy, frame, t }: { copy: Copy["phone"]; frame: number; t: PhoneTimeline }) {
  const { fps } = useVideoConfig();

  const total = copy.tasks.length;
  const ticked = t.ticksAt.map((at) => progress(frame, at, 14)).reduce((a, b) => a + b, 0);
  const doneCount = t.ticksAt.filter((at) => frame >= at + 6).length;
  const circumference = 2 * Math.PI * 15;
  const filled = (circumference * ticked) / total;

  const banner = progress(frame, t.bannerAt, 18);

  return (
    <PhoneFrame>
        <div style={{ padding: "58px 18px 0" }}>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 2 }}>{copy.date}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>{copy.title}</div>
            <div style={{ display: "flex", gap: 18, color: colors.accent }}>
              <IconTarget size={24} stroke={1.8} />
              <IconChartBar size={24} stroke={1.8} />
            </div>
          </div>

          {/* Summary tiles */}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div style={tile}>
              <svg width={56} height={56} viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", flex: "none" }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke={colors.separator} strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeOpacity={filled > 0 ? 1 : 0}
                  strokeDasharray={`${filled} ${circumference}`}
                />
              </svg>
              <div>
                <div style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                  {doneCount}/{total}
                </div>
                <div style={{ fontSize: 15, color: colors.textSecondary }}>{copy.done}</div>
              </div>
            </div>
            <div style={{ ...tile, flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.accent, fontSize: 14, fontWeight: 600 }}>
                <IconCalendarEvent size={16} stroke={2} />
                {copy.next}
              </div>
              <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>10:30</div>
              <div style={{ fontSize: 14, color: colors.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                {copy.nextTask}
              </div>
            </div>
          </div>

          {/* Claude banner (D-008) */}
          <div style={{ height: banner * 72, opacity: banner, overflow: "hidden", transform: `translateY(${(1 - banner) * -8}px)` }}>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 14,
                background: "rgba(10,132,255,0.16)",
                fontSize: 15,
                lineHeight: 1.3,
              }}
            >
              <IconSparkles size={20} stroke={1.8} color={colors.accent} style={{ flex: "none" }} />
              <div style={{ flex: 1 }}>{copy.banner}</div>
              <div style={{ color: colors.accent, fontWeight: 600 }}>{copy.undo}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: colors.textSecondary, padding: "18px 0 8px 16px" }}>{copy.section}</div>

          {/* Task list */}
          <div style={{ background: colors.card, borderRadius: 16, overflow: "hidden" }}>
            {copy.tasks.map((task, i) => {
              const hasMeta = Boolean(task.time || task.source);
              const h = hasMeta ? 76 : 56;
              const claudeIndex = task.byClaude ? copy.tasks.filter((x, j) => x.byClaude && j < i).length : -1;
              const enter = task.byClaude ? progress(frame, t.tasksAt[claudeIndex] ?? 0, 18) : 1;
              const tickAt = t.ticksAt[i];
              const tick = tickAt === undefined ? 0 : spring({ frame: frame - tickAt, fps, config: { damping: 12, stiffness: 180 } });
              const checked = tickAt !== undefined && frame >= tickAt;
              return (
                <div key={task.title} style={{ height: h * enter, opacity: enter, overflow: "hidden" }}>
                  <div
                    style={{
                      height: h,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "0 14px 0 16px",
                      borderTop: i === 0 ? "none" : `1px solid ${colors.separator}`,
                      transform: `translateX(${(1 - enter) * -14}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        border: `1.5px solid ${checked ? colors.accent : colors.textSecondary}`,
                        background: checked ? colors.accent : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.onAccent,
                        flex: "none",
                      }}
                    >
                      {checked ? <IconCheck size={14} stroke={3} style={{ transform: `scale(${Math.min(tick, 1.15)})` }} /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, opacity: checked ? 0.45 : 1 }}>
                      <div style={{ fontSize: 17, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                      {hasMeta ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
                          {task.time ? <span style={{ color: colors.accent }}>{task.time}</span> : null}
                          {task.time && task.source ? <span>·</span> : null}
                          {task.source ? <SourceIcon kind={task.source} size={13} /> : null}
                          {task.sourceLabel ? <span>{task.sourceLabel}</span> : null}
                        </div>
                      ) : null}
                    </div>
                    {task.priority ? <div style={{ color: colors.accent, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>!!!</div> : null}
                    <IconGripVertical size={18} stroke={1.6} color={colors.textSecondary} style={{ opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 14,
              background: colors.card,
              color: colors.textSecondary,
              fontSize: 17,
            }}
          >
            <IconCirclePlus size={22} stroke={1.8} color={colors.accent} />
            {copy.newTask}
          </div>
        </div>

        <TabBar labels={copy.tabs} active={0} />

        <DropIn frame={frame - t.notifAt}>
          <NotificationCard app={copy.notification.app} when={copy.notification.when} title={copy.notification.title} body={copy.notification.body} bellFrame={frame - t.notifAt} />
        </DropIn>
    </PhoneFrame>
  );
}

const tile: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: colors.card,
  borderRadius: 16,
  padding: "16px 16px",
  height: 94,
  boxSizing: "border-box",
};
