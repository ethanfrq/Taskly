import { IconCalendarEvent, IconRepeat } from "@tabler/icons-react";
import type { SourceKind } from "../../copy";
import { progress } from "../../motion";
import { colors, font } from "../../theme";
import { SourceIcon } from "../SourceIcon";
import { TabBar } from "../TabBar";

export type AgendaItem =
  | { kind: "task"; title: string; time?: string; source?: SourceKind; sourceLabel?: string; priority?: 1 | 2 | 3; list?: string; recurring?: boolean }
  | { kind: "event"; time: string; title: string; place: string; cancelAt?: number };

export type AgendaGroup = { label: string; items: AgendaItem[] };

/** The Agenda: meetings and tasks of the coming days, in time order. A cancelled meeting folds away. */
export function AgendaScreen({ title, groups, frame, tabs }: { title: string; groups: AgendaGroup[]; frame: number; tabs: string[] }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ padding: "58px 18px 0" }}>
        <div style={{ fontFamily: font.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>{title}</div>
        {groups.map((group) => (
          <div key={group.label}>
            <div style={{ fontSize: 13, color: colors.textSecondary, padding: "18px 0 8px 16px" }}>{group.label}</div>
            <div style={{ background: colors.card, borderRadius: 16, overflow: "hidden" }}>
              {group.items.map((item, i) => {
                const gone = item.kind === "event" && item.cancelAt !== undefined ? progress(frame, item.cancelAt, 20) : 0;
                const h = item.kind === "event" ? 70 : item.time || item.source || item.list ? 76 : 56;
                return (
                  <div key={`${item.title}-${i}`} style={{ height: h * (1 - gone), opacity: 1 - gone, overflow: "hidden" }}>
                    <div style={{ height: h, display: "flex", alignItems: "center", gap: 14, padding: "0 14px 0 16px", borderTop: i === 0 ? "none" : `1px solid ${colors.separator}` }}>
                      {item.kind === "event" ? (
                        <>
                          <div style={{ width: 54, color: colors.accent, fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{item.time}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{item.place}</div>
                          </div>
                          <IconCalendarEvent size={18} stroke={1.6} color={colors.textSecondary} />
                        </>
                      ) : (
                        <>
                          <div style={{ width: 22, height: 22, borderRadius: 999, border: `1.5px solid ${colors.textSecondary}`, flex: "none" }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                            {item.time || item.source || item.list ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
                                {item.list ? (
                                  <>
                                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "#5e5ce6" }} />
                                    <span>{item.list}</span>
                                    <span>·</span>
                                  </>
                                ) : null}
                                {item.time ? <span style={{ color: colors.accent }}>{item.time}</span> : null}
                                {item.time && (item.source || item.recurring) ? <span>·</span> : null}
                                {item.recurring ? <IconRepeat size={13} stroke={1.8} /> : null}
                                {item.source ? <SourceIcon kind={item.source} size={13} /> : null}
                                {item.sourceLabel ? <span>{item.sourceLabel}</span> : null}
                              </div>
                            ) : null}
                          </div>
                          {item.priority ? <div style={{ color: colors.accent, fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{"!".repeat(item.priority)}</div> : null}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <TabBar labels={tabs} active={1} />
    </div>
  );
}
