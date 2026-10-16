import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import webpush from "web-push";

export type VapidKeys = { publicKey: string; privateKey: string; subject: string };

const DEV_KEYS_FILE = ".data/vapid.json";
let cached: VapidKeys | null = null;

/**
 * VAPID keys identify this Taskly instance to push services.
 * Production: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT.
 * Local development: generated once and kept in .data/vapid.json.
 */
export function getVapidKeys(): VapidKeys | null {
  if (cached) return cached;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@taskly.invalid";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    cached = { publicKey, privateKey, subject };
    return cached;
  }
  if (process.env.NODE_ENV === "production" && !process.env.TASKLY_ALLOW_DEV_SECRET) return null;

  if (existsSync(DEV_KEYS_FILE)) {
    const saved = JSON.parse(readFileSync(DEV_KEYS_FILE, "utf8")) as Omit<VapidKeys, "subject">;
    cached = { ...saved, subject };
  } else {
    const keys = webpush.generateVAPIDKeys();
    mkdirSync(".data", { recursive: true });
    writeFileSync(DEV_KEYS_FILE, JSON.stringify(keys, null, 2));
    cached = { ...keys, subject };
  }
  return cached;
}
