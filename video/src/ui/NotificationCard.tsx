import { IconBellRinging } from "@tabler/icons-react";
import type { PropsWithChildren } from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Monogram } from "../brand/Logo";
import { colors } from "../theme";
import { SCREEN } from "./PhoneFrame";

/** An iOS notification from Taskly: app icon, name and time, title, body, and optionally a ringing bell. */
export function NotificationCard({
  app,
  when,
  title,
  body,
  bellFrame,
  width = SCREEN.width - 24,
}: {
  app: string;
  when: string;
  title: string;
  body: string;
  /** Frames since the notification arrived; the bell swings for the first second. */
  bellFrame?: number;
  width?: number;
}) {
  const bell =
    bellFrame === undefined
      ? 0
      : interpolate(bellFrame, [4, 10, 16, 22], [0, -14, 10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return (
    <div
      style={{
        width,
        borderRadius: 24,
        background: "rgba(44,44,46,0.92)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
        padding: "12px 16px 14px 14px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        backdropFilter: "blur(20px)",
        color: colors.text,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 11, background: colors.graphite, color: colors.ivory, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <Monogram style={{ width: 25, height: 25 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.textSecondary, letterSpacing: 0.4 }}>
          <span style={{ fontWeight: 600 }}>{app}</span>
          <span>{when}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.3 }}>{body}</div>
      </div>
      {bellFrame !== undefined ? <IconBellRinging size={22} stroke={1.8} color={colors.accent} style={{ transform: `rotate(${bell}deg)`, flex: "none" }} /> : null}
    </div>
  );
}

/** Drops its child from above the screen with a soft overshoot; renders nothing before `frame` 0. */
export function DropIn({ frame, top = 14, children }: PropsWithChildren<{ frame: number; top?: number }>) {
  const { fps } = useVideoConfig();
  if (frame < 0) return null;
  const drop = spring({ frame, fps, config: { damping: 18, stiffness: 140, mass: 0.9 } });
  return (
    <div style={{ position: "absolute", top: 0, left: 12, right: 12, transform: `translateY(${interpolate(drop, [0, 1], [-160, top])}px)`, zIndex: 5 }}>
      {children}
    </div>
  );
}
