"use client";

import { useEffect } from "react";
import { reportInstalledAction } from "@/lib/preferences-actions";

/** Tells the server, once per session, that the app runs from the home screen. */
export function InstalledReporter() {
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (!standalone) return;
    try {
      if (sessionStorage.getItem("taskly:installed-reported")) return;
      sessionStorage.setItem("taskly:installed-reported", "1");
    } catch {
      // Private mode: report anyway.
    }
    void reportInstalledAction();
  }, []);
  return null;
}
