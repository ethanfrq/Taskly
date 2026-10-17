import { IconBrandGithub, IconFingerprint, IconUnlink } from "@tabler/icons-react";
import { AbsoluteFill } from "remotion";
import type { Copy } from "../copy";
import { Rise } from "../motion";
import { colors } from "../theme";
import { Display, Pill } from "../ui/text";

const ICONS = [IconBrandGithub, IconFingerprint, IconUnlink];

/** What Taskly promises, in three pills. */
export function Values({ c }: { c: Copy }) {
  return (
    <AbsoluteFill style={{ background: colors.bg, justifyContent: "center", alignItems: "center" }}>
      <Rise at={0} duration={26}>
        <Display size={104} style={{ textAlign: "center" }}>
          {c.values.title}
        </Display>
      </Rise>
      <div style={{ display: "flex", gap: 20, marginTop: 64 }}>
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
