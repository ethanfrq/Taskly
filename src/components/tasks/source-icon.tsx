import {
  IconBrandGmail,
  IconBrandNotion,
  IconBrandSlack,
  IconBrandTeams,
  IconCalendarEvent,
  IconLink,
  IconMail,
} from "@tabler/icons-react";
import type { SourceKind } from "@/lib/tasks/sources";

const ICONS = {
  gmail: IconBrandGmail,
  outlook: IconMail,
  calendar: IconCalendarEvent,
  slack: IconBrandSlack,
  teams: IconBrandTeams,
  notion: IconBrandNotion,
  other: IconLink,
} satisfies Record<SourceKind, unknown>;

export function SourceIcon({ kind, size = 13 }: { kind: SourceKind; size?: number }) {
  const Icon = ICONS[kind];
  return <Icon size={size} stroke={1.8} aria-hidden className="inline-block align-[-2px]" />;
}
