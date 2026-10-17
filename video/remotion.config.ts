import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setOverwriteOutput(true);
// Flat colors and sharp text: JPEG frames keep the render fast without visible loss.
Config.setVideoImageFormat("jpeg");
