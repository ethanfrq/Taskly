import { IconCopy, IconSparkles } from "@tabler/icons-react";
import { interpolate } from "remotion";
import { progress } from "../../motion";
import { colors, font } from "../../theme";
import { Tap } from "../layout";
import { SCREEN } from "../PhoneFrame";
import { TabBar } from "../TabBar";

export type ClaudeCopy = {
  title: string;
  connected: string;
  connectedSince: string;
  urlLabel: string;
  url: string;
  copy: string;
  morningTip: string;
  disconnect: string;
  disconnectHint: string;
  dialogTitle: string;
  dialogBody: string;
  cancel: string;
  confirm: string;
  disconnected: string;
  disconnectedHint: string;
  connect: string;
};

const BUTTON_Y = 548;

/** Settings › Connect Claude: the connection, the address, and the disconnect flow. */
export function ClaudeScreen({ c, frame, tabs, tapAt, confirmAt }: { c: ClaudeCopy; frame: number; tabs: string[]; tapAt: number; confirmAt: number }) {
  const dialog = Math.min(progress(frame, tapAt + 6, 14), 1 - progress(frame, confirmAt + 4, 12));
  const off = frame >= confirmAt + 10;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ padding: "58px 18px 0" }}>
        <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>{c.title}</div>

        <div style={{ background: colors.card, borderRadius: 16, padding: "16px", marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: off ? colors.textSecondary : "#34c759", flex: "none", boxShadow: off ? "none" : "0 0 0 4px rgba(52,199,89,0.2)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{off ? c.disconnected : c.connected}</div>
            <div style={{ fontSize: 14, color: colors.textSecondary }}>{off ? c.disconnectedHint : c.connectedSince}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: colors.textSecondary, padding: "20px 0 8px 16px" }}>{c.urlLabel}</div>
        <div style={{ background: colors.card, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.url}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: colors.accent, fontSize: 15, fontWeight: 600 }}>
            <IconCopy size={16} stroke={2} />
            {c.copy}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "16px 16px 0", fontSize: 14, color: colors.textSecondary, lineHeight: 1.35 }}>
          <IconSparkles size={18} stroke={1.8} color={colors.accent} style={{ flex: "none", marginTop: 1 }} />
          {c.morningTip}
        </div>

        <div style={{ marginTop: 22 }}>
          {off ? (
            <div style={{ background: colors.accent, color: colors.onAccent, borderRadius: 14, padding: "15px 16px", textAlign: "center", fontSize: 17, fontWeight: 600 }}>{c.connect}</div>
          ) : (
            <>
              <div style={{ background: colors.card, color: "#ff453a", borderRadius: 14, padding: "15px 16px", textAlign: "center", fontSize: 17, fontWeight: 600 }}>{c.disconnect}</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, padding: "8px 16px 0" }}>{c.disconnectHint}</div>
            </>
          )}
        </div>
      </div>

      <Tap frame={frame - tapAt} x={SCREEN.width / 2} y={BUTTON_Y} />

      {dialog > 0 ? (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.5 * dialog})`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 8 }}>
          <div
            style={{
              width: 290,
              borderRadius: 18,
              background: "rgba(44,44,46,0.98)",
              textAlign: "center",
              overflow: "hidden",
              opacity: dialog,
              transform: `scale(${interpolate(dialog, [0, 1], [1.08, 1])})`,
            }}
          >
            <div style={{ padding: "20px 18px 16px" }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{c.dialogTitle}</div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 1.35 }}>{c.dialogBody}</div>
            </div>
            <div style={{ display: "flex", borderTop: `1px solid ${colors.separator}` }}>
              <div style={{ flex: 1, padding: "12px 0", color: colors.accent, fontSize: 17, borderRight: `1px solid ${colors.separator}` }}>{c.cancel}</div>
              <div style={{ flex: 1, padding: "12px 0", color: "#ff453a", fontSize: 17, fontWeight: 600 }}>{c.confirm}</div>
            </div>
          </div>
          <Tap frame={frame - confirmAt} x={SCREEN.width / 2 + 72} y={SCREEN.height / 2 + 52} />
        </div>
      ) : null}
      <TabBar labels={tabs} active={3} />
    </div>
  );
}
