// The install prompt event, Chromium only (not in TypeScript's DOM types).
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface Window {
  __tasklyInstallPrompt?: BeforeInstallPromptEvent;
}

interface Navigator {
  /** iOS Safari: true when running from the home screen. */
  standalone?: boolean;
}
