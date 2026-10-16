"use client";

import { IconBell, IconBellOff, IconCircleCheck } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { type PushState, enablePush, pushState, sendTestPush } from "@/lib/push/client";

type TestState = "idle" | "waiting" | "received" | "timeout";

const noop = () => () => {};

/**
 * Asks for notification permission, subscribes the device, and sends a test
 * the service worker confirms (design D-006).
 */
export function NotificationSetup({
  testReceived,
  onDone,
}: {
  /** The server already saw a test arrive on one of the user's devices. */
  testReceived: boolean;
  /** Shown as the main button once the test worked (onboarding). */
  onDone?: { label: string; action: () => void };
}) {
  const { t } = useI18n();
  const detected = useSyncExternalStore(noop, pushState, () => null);
  const [override, setOverride] = useState<PushState | "not-configured" | null>(null);
  const [test, setTest] = useState<TestState>(testReceived ? "received" : "idle");
  const [pending, startTransition] = useTransition();
  const state = override ?? detected;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "taskly:test-received") setTest("received");
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (test !== "waiting") return;
    const timer = setTimeout(() => setTest((current) => (current === "waiting" ? "timeout" : current)), 15_000);
    return () => clearTimeout(timer);
  }, [test]);

  const allow = () =>
    startTransition(async () => {
      setOverride(await enablePush());
    });

  const runTest = () =>
    startTransition(async () => {
      setTest("waiting");
      if (!(await sendTestPush())) setTest("timeout");
    });

  if (state === null) return null;

  const icon = (Icon: typeof IconBell, danger = false) => (
    <div
      className={`mx-auto flex size-20 items-center justify-center rounded-full ${danger ? "bg-fill text-text-secondary" : "bg-[color-mix(in_srgb,var(--accent)_16%,var(--card))] text-accent-text"}`}
    >
      <Icon size={40} stroke={1.6} aria-hidden />
    </div>
  );

  const block = (title: string, body: string, actions: React.ReactNode, Icon = IconBell, danger = false) => (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        {icon(Icon, danger)}
        <h2 className="mt-5 text-[24px] font-bold tracking-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-xs text-[16px] text-text-secondary">{body}</p>
      </div>
      <div className="flex flex-col gap-2">{actions}</div>
    </div>
  );

  if (state === "needs-install") {
    return block(
      t.notifications.needsInstallTitle,
      t.notifications.needsInstallBody,
      <Link href="/install" className={buttonClass("secondary")}>
        {t.notifications.openInstall}
      </Link>,
    );
  }
  if (state === "unsupported") return block(t.notifications.title, t.notifications.unsupported, null, IconBellOff, true);
  if (state === "not-configured") return block(t.notifications.title, t.notifications.notConfigured, null, IconBellOff, true);
  if (state === "denied") {
    return block(t.notifications.deniedTitle, t.notifications.deniedBody, null, IconBellOff, true);
  }
  if (state === "default") {
    return block(
      t.notifications.title,
      t.notifications.body,
      <Button onClick={allow} disabled={pending}>
        {t.notifications.allow}
      </Button>,
    );
  }

  // Granted
  if (test === "received") {
    return block(
      t.notifications.worksTitle,
      t.notifications.worksBody,
      <>
        {onDone ? <Button onClick={onDone.action}>{onDone.label}</Button> : null}
        <Button variant="plain" onClick={runTest} disabled={pending}>
          {t.notifications.sendTest}
        </Button>
      </>,
      IconCircleCheck,
    );
  }
  return block(
    t.notifications.enabledTitle,
    test === "timeout" ? t.notifications.notReceived : t.notifications.enabledBody,
    <Button onClick={runTest} disabled={pending || test === "waiting"}>
      {test === "waiting" ? t.notifications.waiting : t.notifications.sendTest}
    </Button>,
  );
}
