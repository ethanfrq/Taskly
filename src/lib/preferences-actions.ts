"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { LOCALES } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { requireUser } from "@/lib/auth/session";
import { savePreferences } from "@/lib/preferences";
import { isValidTime, isValidTimeZone } from "@/lib/time";

const time = z.string().refine(isValidTime);

const schema = z
  .object({
    locale: z.enum(LOCALES),
    timeZone: z.string().max(64).refine(isValidTimeZone),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    appearance: z.enum(["light", "dark", "auto"]),
    briefingTime: time,
    reviewTime: time,
    quietStart: time,
    quietEnd: time,
    insistence: z.number().int().min(1).max(4),
    followUpPriorityOnly: z.boolean(),
  })
  .partial();

export async function savePreferencesAction(patch: z.input<typeof schema>) {
  const user = await requireUser();
  const data = schema.parse(patch);
  await savePreferences(getDb(), user.id, data);
  if (data.locale) await setLocale(data.locale);
  revalidatePath("/", "layout");
}

/** The app was opened from the home screen: remember it for the health check. */
export async function reportInstalledAction() {
  const user = await requireUser();
  await savePreferences(getDb(), user.id, { installedSeenAt: new Date() });
}

export async function completeOnboardingAction() {
  const user = await requireUser();
  await savePreferences(getDb(), user.id, { onboardedAt: new Date() });
  revalidatePath("/", "layout");
  redirect("/today");
}
