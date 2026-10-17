"use client";

import { IconCalendar, IconList, IconSettings, IconSun } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";

export function TabBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const tabs = [
    { href: "/today", label: t.nav.today, Icon: IconSun },
    { href: "/agenda", label: t.nav.agenda, Icon: IconCalendar },
    { href: "/lists", label: t.nav.lists, Icon: IconList },
    { href: "/settings", label: t.nav.settings, Icon: IconSettings },
  ];
  return (
    <nav
      aria-label="Taskly"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-separator bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] ${active ? "text-accent-text" : "text-text-secondary"}`}
              >
                <Icon size={24} stroke={1.7} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
