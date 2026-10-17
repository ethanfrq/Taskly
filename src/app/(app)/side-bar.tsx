"use client";

import { IconCalendar, IconChartBar, IconList, IconSettings, IconSun, IconTarget } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { useI18n } from "@/i18n/client";

/** Navigation on large screens, in place of the tab bar: a Mac-style sidebar. */
export function SideBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const main = [
    { href: "/today", label: t.nav.today, Icon: IconSun },
    { href: "/agenda", label: t.nav.agenda, Icon: IconCalendar },
    { href: "/lists", label: t.nav.lists, Icon: IconList },
  ];
  const more = [
    { href: "/focus", label: t.focus.title, Icon: IconTarget },
    { href: "/stats", label: t.stats.open, Icon: IconChartBar },
  ];
  const item = ({ href, label, Icon }: (typeof main)[number]) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors ${
            active ? "bg-fill font-medium" : "hover:bg-fill/60"
          }`}
        >
          <Icon size={20} stroke={1.8} className="text-accent-text" aria-hidden />
          {label}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Taskly"
      className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-separator bg-card/40 px-3 pt-6 pb-4 lg:flex"
    >
      <Link href="/today" className="mb-6 px-3">
        <Logo className="h-7 w-auto" />
      </Link>
      <ul className="flex flex-col gap-0.5">{main.map(item)}</ul>
      <ul className="mt-6 flex flex-col gap-0.5 border-t border-separator pt-6">{more.map(item)}</ul>
      <ul className="mt-auto flex flex-col gap-0.5">
        {item({ href: "/settings", label: t.nav.settings, Icon: IconSettings })}
      </ul>
    </nav>
  );
}
