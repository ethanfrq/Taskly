import type { CSSProperties, PropsWithChildren } from "react";
import { colors, font } from "../theme";

export function Display({ size = 80, style, children }: PropsWithChildren<{ size?: number; style?: CSSProperties }>) {
  return (
    <div
      style={{
        fontFamily: font.display,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: "-0.025em",
        lineHeight: 1.05,
        color: colors.text,
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Body({ size = 36, style, children }: PropsWithChildren<{ size?: number; style?: CSSProperties }>) {
  return (
    <div style={{ fontFamily: font.text, fontSize: size, lineHeight: 1.35, color: colors.textSecondary, ...style }}>{children}</div>
  );
}

/** The landing page's pill: a rounded surface with an icon and a label. */
export function Pill({ size = 28, style, children }: PropsWithChildren<{ size?: number; style?: CSSProperties }>) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5 * size,
        padding: `${0.5 * size}px ${0.9 * size}px`,
        borderRadius: 999,
        background: colors.card,
        border: "1px solid rgba(255,255,255,0.08)",
        fontFamily: font.text,
        fontSize: size,
        fontWeight: 500,
        color: colors.text,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
