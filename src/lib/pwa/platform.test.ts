import { describe, expect, it } from "vitest";
import { detectInstallPlatform, iosSupportsPush } from "./platform";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_MODE = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const MAC_SAFARI = IPAD_DESKTOP_MODE;
const ANDROID = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36";
const FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0";

const input = (userAgent: string, extra: Partial<Parameters<typeof detectInstallPlatform>[0]> = {}) => ({
  userAgent,
  maxTouchPoints: 0,
  standalone: false,
  canPrompt: false,
  ...extra,
});

describe("detectInstallPlatform", () => {
  it("knows the installed app", () => {
    expect(detectInstallPlatform(input(IPHONE, { standalone: true }))).toBe("standalone");
  });

  it("sends iPhone and iPad (even in desktop mode) to the Share sheet steps", () => {
    expect(detectInstallPlatform(input(IPHONE, { maxTouchPoints: 5 }))).toBe("ios");
    expect(detectInstallPlatform(input(IPAD_DESKTOP_MODE, { maxTouchPoints: 5 }))).toBe("ios");
  });

  it("uses the browser prompt on Chromium", () => {
    expect(detectInstallPlatform(input(ANDROID, { maxTouchPoints: 5 }))).toBe("prompt");
  });

  it("explains Add to Dock on Safari for Mac", () => {
    expect(detectInstallPlatform(input(MAC_SAFARI))).toBe("mac-safari");
  });

  it("admits when installing is not possible", () => {
    expect(detectInstallPlatform(input(FIREFOX))).toBe("unsupported");
  });
});

describe("iosSupportsPush", () => {
  it("needs iOS 16.4", () => {
    expect(iosSupportsPush(IPHONE)).toBe(true);
    expect(iosSupportsPush("iPhone OS 16_3 like Mac OS X")).toBe(false);
    expect(iosSupportsPush("iPhone OS 16_4 like Mac OS X")).toBe(true);
  });
});
