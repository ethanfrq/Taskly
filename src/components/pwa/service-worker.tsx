"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js. Off in development unless NEXT_PUBLIC_SW_DEV=1,
 * so the asset cache never serves stale hot-reload chunks.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SW_DEV !== "1") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);

  // Keep the install prompt for the /install page (Chrome, Edge, Android).
  useEffect(() => {
    const keep = (event: Event) => {
      event.preventDefault();
      window.__tasklyInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("taskly:installable"));
    };
    window.addEventListener("beforeinstallprompt", keep);
    return () => window.removeEventListener("beforeinstallprompt", keep);
  }, []);

  return null;
}
