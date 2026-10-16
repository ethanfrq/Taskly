"use client";

import { useState, useTransition } from "react";
import { AccentPicker } from "@/components/setup/accent-picker";
import { type Rhythm, RhythmForm } from "@/components/setup/rhythm-form";
import { savePreferencesAction } from "@/lib/preferences-actions";
import type { Appearance } from "@/lib/theme/tokens";

type Values = Rhythm & { accent: string; appearance: Appearance };

/** Appearance or rhythm settings, saved as soon as they change. */
export function PreferencesForm({ initial, section }: { initial: Values; section: "appearance" | "rhythm" }) {
  const [values, setValues] = useState(initial);
  const [, startTransition] = useTransition();
  const update = (patch: Partial<Values>) => {
    setValues((v) => ({ ...v, ...patch }));
    startTransition(() => savePreferencesAction(patch));
  };
  return section === "appearance" ? (
    <AccentPicker accent={values.accent} appearance={values.appearance} onChange={update} />
  ) : (
    <RhythmForm value={values} onChange={update} />
  );
}
