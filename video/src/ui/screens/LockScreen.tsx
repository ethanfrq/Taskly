import { IconLock } from "@tabler/icons-react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { progress } from "../../motion";
import { colors, font } from "../../theme";
import { Tap } from "../layout";
import { NotificationCard } from "../NotificationCard";
import { SCREEN } from "../PhoneFrame";

export type LockNotification = { title: string; body: string; when: string; at: number; bell?: boolean };

const CARD_GAP = 10;
const CARD_H = 92;
const STACK_TOP = 300;

/** The lock screen: time and date, then Taskly's notifications stacking up, newest on top. */
export function LockScreen({
  time,
  date,
  app,
  notifications,
  frame,
  tapAt,
}: {
  time: string;
  date: string;
  app: string;
  notifications: LockNotification[];
  frame: number;
  tapAt?: number;
}) {
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0a1324 0%, #000 55%)" }}>
      <IconLock size={20} stroke={1.8} color={colors.textSecondary} style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)" }} />
      <div style={{ position: "absolute", top: 92, left: 0, right: 0, textAlign: "center", fontSize: 17, color: colors.textSecondary }}>{date}</div>
      <div style={{ position: "absolute", top: 112, left: 0, right: 0, textAlign: "center", fontFamily: font.display, fontSize: 92, fontWeight: 300, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>
        {time}
      </div>
      {notifications.map((n, i) => {
        if (frame < n.at) return null;
        const arrived = notifications.filter((o, j) => j !== i && o.at > n.at && frame >= o.at);
        // Older cards slide down as newer ones arrive.
        const slot = arrived.reduce((acc, o) => acc + progress(frame, o.at, 18), 0);
        const drop = spring({ frame: frame - n.at, fps, config: { damping: 18, stiffness: 140, mass: 0.9 } });
        const y = STACK_TOP + slot * (CARD_H + CARD_GAP) + interpolate(drop, [0, 1], [-60, 0]);
        return (
          <div key={`${n.title}-${n.at}`} style={{ position: "absolute", left: 12, top: y, width: SCREEN.width - 24, opacity: interpolate(drop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }), zIndex: 10 - slot }}>
            <NotificationCard app={app} when={n.when} title={n.title} body={n.body} bellFrame={n.bell ? frame - n.at : undefined} />
          </div>
        );
      })}
      {tapAt !== undefined ? <Tap frame={frame - tapAt} x={SCREEN.width / 2} y={STACK_TOP + CARD_H / 2} /> : null}
    </div>
  );
}
