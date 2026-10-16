"use client";

export type PushState =
  | "unsupported" // no service worker or Push API
  | "needs-install" // iPhone/iPad in Safari: install first
  | "default" // not asked yet
  | "denied"
  | "granted";

function isIos() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

export function pushState(): PushState {
  if (typeof window === "undefined") return "unsupported";
  if (isIos() && !isStandalone()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/**
 * Asks for permission (must run from a tap), subscribes this device and
 * saves the subscription. Returns the resulting state.
 */
export async function enablePush(): Promise<PushState | "not-configured"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const keyResponse = await fetch("/api/push");
  if (!keyResponse.ok) return "not-configured";
  const { publicKey } = (await keyResponse.json()) as { publicKey: string };

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));

  await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  return "granted";
}

export async function sendTestPush(): Promise<boolean> {
  const response = await fetch("/api/push/test", { method: "POST" });
  if (!response.ok) return false;
  const { sent } = (await response.json()) as { sent: number };
  return sent > 0;
}
