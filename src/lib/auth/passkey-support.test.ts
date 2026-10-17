import { afterEach, describe, expect, it, vi } from "vitest";
import { passkeyKind, passkeySavedOnDevice, rememberPasskeyOnDevice } from "./passkey-support";

afterEach(() => vi.unstubAllGlobals());

const storage = () => {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
};

describe("passkey on this device", () => {
  it("is unknown until a passkey is created or used here", () => {
    vi.stubGlobal("window", { localStorage: storage() });
    expect(passkeySavedOnDevice()).toBe(false);
    rememberPasskeyOnDevice();
    expect(passkeySavedOnDevice()).toBe(true);
  });

  it("stays quiet when storage is blocked (private browsing)", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    vi.stubGlobal("window", { localStorage: blocked });
    expect(() => rememberPasskeyOnDevice()).not.toThrow();
    expect(passkeySavedOnDevice()).toBe(false);
  });
});

describe("passkeyKind", () => {
  it("names Face ID on iPhone and Touch ID on a Mac", () => {
    expect(passkeyKind("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("face-id");
    vi.stubGlobal("navigator", { maxTouchPoints: 0 });
    expect(passkeyKind("Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)")).toBe("touch-id");
    expect(passkeyKind("Mozilla/5.0 (Windows NT 10.0)")).toBe("generic");
  });
});
