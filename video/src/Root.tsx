import { Composition } from "remotion";
import { DURATION, FPS, Video } from "./Video";

const landscape = { component: Video, durationInFrames: DURATION, fps: FPS, width: 1920, height: 1080 } as const;
const portrait = { ...landscape, width: 1080, height: 1920 } as const;

/** Landscape for the web, YouTube and LinkedIn; portrait for Reels, TikTok and Shorts. */
export function Root() {
  return (
    <>
      <Composition id="TasklyPromoFR" {...landscape} defaultProps={{ lang: "fr" }} />
      <Composition id="TasklyPromoEN" {...landscape} defaultProps={{ lang: "en" }} />
      <Composition id="TasklyPromoFR-Vertical" {...portrait} defaultProps={{ lang: "fr" }} />
      <Composition id="TasklyPromoEN-Vertical" {...portrait} defaultProps={{ lang: "en" }} />
    </>
  );
}
