import { Composition } from "remotion";
import { DURATION, FPS, Video } from "./Video";

const base = { component: Video, durationInFrames: DURATION, fps: FPS, width: 1920, height: 1080 } as const;

export function Root() {
  return (
    <>
      <Composition id="TasklyPromoFR" {...base} defaultProps={{ lang: "fr" }} />
      <Composition id="TasklyPromoEN" {...base} defaultProps={{ lang: "en" }} />
    </>
  );
}
