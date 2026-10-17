"use client";

import { IconCheck, IconShare2, IconSquarePlus } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Monogram } from "@/components/brand/logo";
import { Button, buttonClass } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { type InstallPlatform, detectInstallPlatform, iosSupportsPush } from "@/lib/pwa/platform";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

export function InstallGuide() {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [oldIos, setOldIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const detect = () => {
      setPlatform(
        detectInstallPlatform({
          userAgent: navigator.userAgent,
          maxTouchPoints: navigator.maxTouchPoints,
          standalone: isStandalone(),
          canPrompt: !!window.__tasklyInstallPrompt,
        }),
      );
      setOldIos(!iosSupportsPush(navigator.userAgent));
    };
    detect();
    const onInstalled = () => setInstalled(true);
    window.addEventListener("taskly:installable", detect);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("taskly:installable", detect);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const prompt = async () => {
    const event = window.__tasklyInstallPrompt;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") setInstalled(true);
    window.__tasklyInstallPrompt = undefined;
  };

  const steps = [
    { Icon: IconShare2, text: t.install.iosStep1 },
    { Icon: IconSquarePlus, text: t.install.iosStep2 },
    { Icon: IconCheck, text: t.install.iosStep3 },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <Monogram title="" className="h-11 w-11" />
      <h1 className="mt-8 text-[28px] font-bold tracking-tight">{t.install.title}</h1>

      {platform === "standalone" || installed ? (
        <>
          <p className="mt-3 text-[17px] text-text-secondary">{installed ? t.install.installed : t.install.alreadyInstalled}</p>
          <div className="mt-auto pt-10">
            <Link href="/today" className={buttonClass("primary")}>
              {t.install.openApp}
            </Link>
          </div>
        </>
      ) : platform === "ios" ? (
        <>
          <p className="mt-3 text-[17px] text-text-secondary">{t.install.whyIos}</p>
          <ol className="mt-8 divide-y divide-separator overflow-hidden rounded-xl bg-card">
            {steps.map(({ Icon, text }, i) => (
              <li key={text} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fill text-[14px] font-semibold">{i + 1}</span>
                <span className="flex-1 text-[16px]">{text}</span>
                <Icon size={22} stroke={1.8} className="shrink-0 text-accent-text" aria-hidden />
              </li>
            ))}
          </ol>
          {oldIos ? <p className="mt-4 text-[14px] text-danger">{t.install.iosOldVersion}</p> : null}
        </>
      ) : platform === "prompt" ? (
        <>
          <p className="mt-3 text-[17px] text-text-secondary">{t.install.promptTitle}</p>
          <div className="mt-8">
            <Button onClick={prompt}>{t.install.promptButton}</Button>
          </div>
        </>
      ) : platform === "mac-safari" ? (
        <p className="mt-3 text-[17px] text-text-secondary">{t.install.desktopSafari}</p>
      ) : platform === "unsupported" ? (
        <p className="mt-3 text-[17px] text-text-secondary">{t.install.unsupported}</p>
      ) : null}

      {platform && platform !== "standalone" && !installed ? (
        <div className="mt-auto flex flex-col gap-2 pt-10">
          <p className="text-center text-[13px] text-text-secondary">{t.install.browserWarning}</p>
          <Link href="/sign-in" className={buttonClass("plain")}>
            {t.install.continueInBrowser}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
