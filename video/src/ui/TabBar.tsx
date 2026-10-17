import { IconCalendar, IconList, IconSettings, IconSun } from "@tabler/icons-react";
import { colors } from "../theme";

const ICONS = [IconSun, IconCalendar, IconList, IconSettings];

/** The app's tab bar, pinned to the bottom of a screen. */
export function TabBar({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 84,
        borderTop: `1px solid ${colors.separator}`,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        paddingTop: 10,
        zIndex: 2,
      }}
    >
      {labels.map((label, i) => {
        const Icon = ICONS[i];
        const on = i === active;
        return (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: on ? colors.accent : colors.textSecondary }}>
            <Icon size={24} stroke={on ? 2 : 1.7} />
            <div style={{ fontSize: 11 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
