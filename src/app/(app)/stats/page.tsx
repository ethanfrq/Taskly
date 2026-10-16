import { IconFlame, IconSparkles } from "@tabler/icons-react";
import type { Metadata } from "next";
import { Group } from "@/components/ui/group";
import { format, plural } from "@/i18n/format";
import { dayLabel } from "@/lib/date-label";
import { getWeeklyStats } from "@/lib/stats";
import { getAppContext } from "../context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAppContext();
  return { title: `${t.stats.title} · Taskly` };
}

export default async function StatsPage() {
  const { db, user, prefs, t, locale, today } = await getAppContext();
  const stats = await getWeeklyStats(db, user.id, prefs.timeZone);
  const max = Math.max(1, ...stats.days.map((d) => d.done));
  const weekday = (day: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

  const tiles = [
    { label: t.stats.done, value: String(stats.done) },
    { label: t.stats.streak, value: plural(locale, stats.streak, t.stats.streakDays), icon: stats.streak > 0 },
    { label: t.stats.completion, value: stats.completionRate === null ? "–" : `${Math.round(stats.completionRate * 100)} %` },
    { label: t.stats.focus, value: format(t.stats.focusMinutes, { count: stats.focusMinutes }) },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <h1 className="px-1 text-[34px] font-bold tracking-tight">{t.stats.title}</h1>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-card p-3.5">
            <p className="text-[13px] text-text-secondary">{tile.label}</p>
            <p className="mt-1 flex items-center gap-1 text-[24px] font-semibold">
              {tile.icon ? <IconFlame size={22} stroke={1.8} className="text-[#FF9500]" aria-hidden /> : null}
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <Group
        title={t.stats.perDay}
        footer={stats.bestDay && stats.done > 0 ? format(t.stats.bestDay, { day: dayLabel(stats.bestDay, today, locale, t) }) : undefined}
      >
        {stats.done === 0 ? (
          <p className="px-4 py-6 text-center text-text-secondary">{t.stats.empty}</p>
        ) : (
          <ol className="flex h-44 items-end gap-2 px-4 pt-4 pb-3">
            {stats.days.map((d) => (
              <li key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[12px] text-text-secondary tabular-nums">{d.done || ""}</span>
                <span
                  className={`w-full rounded-md ${d.day === today ? "bg-accent" : "bg-[color-mix(in_srgb,var(--accent)_45%,var(--card))]"}`}
                  style={{ height: `${Math.max(4, (d.done / max) * 100)}px` }}
                  aria-label={`${dayLabel(d.day, today, locale, t)} : ${d.done}`}
                />
                <span className={`text-[12px] ${d.day === today ? "font-semibold text-accent-text" : "text-text-secondary"}`} aria-hidden>
                  {weekday(d.day)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Group>

      {stats.fromClaude > 0 ? (
        <p className="flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--accent)_14%,var(--card))] px-4 py-3 text-[15px]">
          <IconSparkles size={18} stroke={1.8} className="text-accent-text" aria-hidden />
          {plural(locale, stats.fromClaude, t.stats.fromClaude)}
        </p>
      ) : null}

      {stats.topLists.length > 0 ? (
        <Group title={t.stats.topLists}>
          <ul className="divide-y divide-separator">
            {stats.topLists.map((list) => (
              <li key={list.name} className="flex items-center gap-3 px-4 py-3">
                <span className="size-3 rounded-full" style={{ background: list.color ?? "var(--accent)" }} aria-hidden />
                <span className="flex-1 text-[16px]">{list.name}</span>
                <span className="text-[15px] text-text-secondary tabular-nums">{list.done}</span>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}
    </div>
  );
}
