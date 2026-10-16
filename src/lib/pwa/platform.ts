export type InstallPlatform =
  | "standalone" // already running as the installed app
  | "ios" // iPhone or iPad: Share › Add to Home Screen
  | "prompt" // Chromium: the browser's install prompt
  | "mac-safari" // Safari on macOS: File › Add to Dock
  | "unsupported";

export type PlatformInput = {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
  canPrompt: boolean;
};

/** Which install path to show, from what the browser reports. */
export function detectInstallPlatform({ userAgent, maxTouchPoints, standalone, canPrompt }: PlatformInput): InstallPlatform {
  if (standalone) return "standalone";
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (ios) return "ios";
  if (canPrompt || /Chrome|Chromium|Edg\//.test(userAgent)) return "prompt";
  if (/Macintosh/.test(userAgent) && /Safari/.test(userAgent)) return "mac-safari";
  return "unsupported";
}

/** iOS major and minor version from the user agent, if any: "OS 17_4" → [17, 4]. */
export function iosVersion(userAgent: string): [number, number] | null {
  const match = userAgent.match(/OS (\d+)_(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/** Web push on iPhone needs iOS 16.4 or later. */
export function iosSupportsPush(userAgent: string): boolean {
  const version = iosVersion(userAgent);
  if (!version) return true;
  const [major, minor] = version;
  return major > 16 || (major === 16 && minor >= 4);
}
