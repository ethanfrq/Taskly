"use client";

export type PasskeyKind = "face-id" | "touch-id" | "generic";

/** Whether this device can use a platform passkey (Face ID, Touch ID, fingerprint…). */
export async function canUsePasskeys(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Names the passkey the way the device does, for button labels. */
export function passkeyKind(userAgent: string): PasskeyKind {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "face-id";
  if (/Macintosh/.test(userAgent)) {
    // iPadOS reports a Mac user agent; touch support tells them apart.
    return typeof navigator !== "undefined" && navigator.maxTouchPoints > 1 ? "face-id" : "touch-id";
  }
  return "generic";
}
