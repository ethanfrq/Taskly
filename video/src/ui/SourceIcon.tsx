import {
  IconBrandGmail,
  IconBrandNotion,
  IconBrandSlack,
  IconBrandTeams,
  IconCalendarEvent,
  IconMail,
} from "@tabler/icons-react";
import type { SourceKind } from "../copy";

/** Same icon per source as the app (src/components/tasks/source-icon.tsx). */
const ICONS = {
  gmail: IconBrandGmail,
  outlook: IconMail,
  calendar: IconCalendarEvent,
  slack: IconBrandSlack,
  teams: IconBrandTeams,
  notion: IconBrandNotion,
} satisfies Record<SourceKind, unknown>;

export function SourceIcon({ kind, size = 13, stroke = 1.8 }: { kind: SourceKind; size?: number; stroke?: number }) {
  const Icon = ICONS[kind];
  return <Icon size={size} stroke={stroke} aria-hidden style={{ display: "block", flex: "none" }} />;
}
