import { IconBell, IconMail, IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch } from "@/components/language-switch";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

/** The public web page (prototype screen 1). Signed-in visitors go straight to Today. */
export default async function Landing() {
  if (await getSession()) redirect("/today");
  const { t } = await getI18n();
  const points = [
    { Icon: IconMail, text: t.landing.point1 },
    { Icon: IconBell, text: t.landing.point2 },
    { Icon: IconShieldCheck, text: t.landing.point3 },
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Logo className="h-9 w-auto self-start" />
      <h1 className="mt-10 text-[34px] leading-[1.1] font-bold tracking-tight whitespace-pre-line">{t.landing.title}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-text-secondary">{t.landing.body}</p>
      <ul className="mt-8 flex flex-col gap-4">
        {points.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-[16px]">
            <Icon size={22} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2 pt-10">
        <Link href="/install" className={buttonClass("primary")}>
          {t.landing.install}
        </Link>
        <Link href="/sign-in" className={buttonClass("plain")}>
          {t.landing.haveAccount}
        </Link>
        <p className="mt-3 text-center text-[13px] text-text-secondary">{t.landing.footer}</p>
        <div className="mt-4">
          <LanguageSwitch />
        </div>
      </div>
    </main>
  );
}
