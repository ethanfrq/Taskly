import type { ComponentType } from "react";
import { Composition } from "remotion";
import type { Lang } from "./copy";
import { FPS, filmDuration } from "./film";
import { DayFilm, DAY } from "./films/day";
import { PrivacyFilm, PRIVACY } from "./films/privacy";
import { RemindersFilm, REMINDERS } from "./films/reminders";
import { PROMO, Video } from "./Video";

const landscape = { fps: FPS, width: 1920, height: 1080 } as const;
const portrait = { fps: FPS, width: 1080, height: 1920 } as const;

/** Every film comes in four: French and English, landscape (web, YouTube, LinkedIn) and portrait (Reels, TikTok, Shorts). */
function four(id: string, component: ComponentType<{ lang: Lang }>, durationInFrames: number) {
  return (["fr", "en"] as const).flatMap((lang) => [
    <Composition key={`${id}-${lang}`} id={`${id}${lang.toUpperCase()}`} component={component} durationInFrames={durationInFrames} defaultProps={{ lang }} {...landscape} />,
    <Composition key={`${id}-${lang}-v`} id={`${id}${lang.toUpperCase()}-Vertical`} component={component} durationInFrames={durationInFrames} defaultProps={{ lang }} {...portrait} />,
  ]);
}

export function Root() {
  return (
    <>
      {four("TasklyPromo", Video, filmDuration(PROMO))}
      {four("TasklyReminders", RemindersFilm, filmDuration(REMINDERS))}
      {four("TasklyPrivacy", PrivacyFilm, filmDuration(PRIVACY))}
      {four("TasklyDay", DayFilm, filmDuration(DAY))}
    </>
  );
}
