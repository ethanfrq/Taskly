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

/** Whether the browser can offer saved passkeys in the email field's autofill (no dialog when there are none). */
export async function canAutofillPasskeys(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential?.isConditionalMediationAvailable) return false;
  try {
    return await PublicKeyCredential.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

const SAVED_KEY = "taskly:passkey-on-device";

/**
 * Whether this device has created or used a Taskly passkey. The explicit
 * Face ID / Touch ID button only shows then: without a passkey, the system
 * would open a "scan a QR code / use a security key" dialog instead.
 */
export function passkeySavedOnDevice(): boolean {
  try {
    return window.localStorage.getItem(SAVED_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberPasskeyOnDevice(): void {
  try {
    window.localStorage.setItem(SAVED_KEY, "1");
  } catch {
    // Private mode or storage blocked: autofill still offers the passkey.
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
