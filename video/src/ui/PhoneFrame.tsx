import type { PropsWithChildren } from "react";
import { colors, font } from "../theme";

export const PHONE = { width: 424, height: 890, bezel: 12 } as const;
export const SCREEN = { width: PHONE.width - PHONE.bezel * 2, height: PHONE.height - PHONE.bezel * 2 } as const;

/** The iPhone-like frame every screen sits in: bezel, rounded screen, Dynamic Island. */
export function PhoneFrame({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        width: PHONE.width,
        height: PHONE.height,
        borderRadius: 66,
        background: "#0b0b0c",
        boxShadow: "0 0 0 1.5px #3a3a3c, 0 40px 90px rgba(0,0,0,0.6)",
        padding: PHONE.bezel,
        position: "relative",
        fontFamily: font.text,
        color: colors.text,
      }}
    >
      <div style={{ width: SCREEN.width, height: SCREEN.height, borderRadius: 54, background: colors.bg, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 118,
            height: 34,
            borderRadius: 999,
            background: "#000",
            boxShadow: "0 0 0 1px #0b0b0c",
            zIndex: 3,
          }}
        />
        {children}
      </div>
    </div>
  );
}
