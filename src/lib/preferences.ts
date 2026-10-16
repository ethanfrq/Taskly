import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { type Preferences, preferences } from "@/db/schema";

export type PreferencesValues = Omit<Preferences, "userId" | "updatedAt">;

export const DEFAULT_PREFERENCES: PreferencesValues = {
  locale: "fr",
  timeZone: "Europe/Paris",
  accent: "#007AFF",
  appearance: "auto",
  briefingTime: "07:30",
  reviewTime: "18:30",
  quietStart: "21:00",
  quietEnd: "07:00",
  insistence: 2,
  followUpPriorityOnly: true,
  onboardedAt: null,
  installedSeenAt: null,
  testPushReceivedAt: null,
  claudeSeenAt: null,
  claudeSources: null,
  claudeDisconnectedAt: null,
};

/** The user's preferences, or the defaults if they haven't been saved yet. */
export async function getPreferences(db: Database, userId: string): Promise<PreferencesValues> {
  const [row] = await db.select().from(preferences).where(eq(preferences.userId, userId));
  if (!row) return { ...DEFAULT_PREFERENCES };
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== "userId" && key !== "updatedAt"),
  ) as PreferencesValues;
}

export async function savePreferences(
  db: Database,
  userId: string,
  patch: Partial<PreferencesValues>,
): Promise<PreferencesValues> {
  const now = new Date();
  await db
    .insert(preferences)
    .values({ ...DEFAULT_PREFERENCES, ...patch, userId, updatedAt: now })
    .onConflictDoUpdate({ target: preferences.userId, set: { ...patch, updatedAt: now } });
  return getPreferences(db, userId);
}
