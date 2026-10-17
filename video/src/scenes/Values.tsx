import { IconBrandGithub, IconFingerprint, IconUnlink } from "@tabler/icons-react";
import { AbsoluteFill } from "remotion";
import type { Copy } from "../copy";
import { Rise, useLayout } from "../motion";
import { colors } from "../theme";
import { Display, Pill } from "../ui/text";

const ICONS = [IconBrandGithub, IconFingerprint, IconUnlink];

/** What Taskly promises, in three pills: in a row, or stacked in portrait. */
export function Values({ c }: { c: Copy }) {
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
      <Rise at={0} duration={26}>
        <Display size={portrait ? 92 : 104} style={{ textAlign: "center" }}>
          {c.values.title}
        </Display>
      </Rise>
      <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: 20, marginTop: 64 }}>
        {c.values.pills.map((label, i) => {
          const Icon = ICONS[i];
          return (
            <Rise key={label} at={18 + i * 8} duration={24} distance={24}>
              <Pill size={34} style={{ fontWeight: 600, padding: "20px 34px" }}>
                <Icon size={38} stroke={1.8} color={colors.accent} />
                {label}
              </Pill>
            </Rise>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
