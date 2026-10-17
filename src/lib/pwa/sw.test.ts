import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

// public/sw.js is plain JavaScript served as-is; it is loaded here with a fake
// service worker scope (self, caches, fetch) and driven through its own listeners.
const source = readFileSync(new URL("../../../public/sw.js", import.meta.url), "utf8");
const ORIGIN = "https://taskly.test";
const VERSION = "taskly-v2";

const toUrl = (request: Request | string) => (typeof request === "string" ? new URL(request, ORIGIN).href : request.url);

class FakeCache {
  entries: Array<[string, Response]> = [];
  async addAll(paths: string[]) {
    for (const path of paths) await this.put(path, new Response(""));
  }
  async put(request: Request | string, response: Response) {
    const url = toUrl(request);
    this.entries = this.entries.filter(([key]) => key !== url);
    this.entries.push([url, response]);
  }
  async keys() {
    return this.entries.map(([url]) => new Request(url));
  }
  async delete(request: Request | string) {
    const url = toUrl(request);
    const before = this.entries.length;
    this.entries = this.entries.filter(([key]) => key !== url);
    return this.entries.length < before;
  }
  async match(request: Request | string) {
    return this.entries.find(([key]) => key === toUrl(request))?.[1];
  }
  paths() {
    return this.entries.map(([url]) => new URL(url).pathname);
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>();
  async open(name: string) {
    const existing = this.stores.get(name);
    if (existing) return existing;
    const created = new FakeCache();
    this.stores.set(name, created);
    return created;
  }
  async keys() {
    return [...this.stores.keys()];
  }
  async delete(name: string) {
    return this.stores.delete(name);
  }
  async match(request: Request | string, options?: { cacheName?: string }) {
    const stores = options?.cacheName ? [this.stores.get(options.cacheName)] : [...this.stores.values()];
    for (const store of stores) {
      const hit = await store?.match(request);
      if (hit) return hit;
    }
    return undefined;
  }
}

type Listener = (event: Record<string, unknown>) => void;

function loadWorker() {
  const listeners = new Map<string, Listener>();
  const caches = new FakeCacheStorage();
  const fetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
  const subscribe = vi.fn();
  const self = {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    location: { origin: ORIGIN },
    registration: { pushManager: { subscribe }, showNotification: vi.fn() },
    clients: { claim: vi.fn(async () => undefined), matchAll: vi.fn(async () => []) },
    navigator: {},
    skipWaiting: vi.fn(),
  };
  new Function("self", "caches", "fetch", source)(self, caches, fetch);

  // Dispatches an event and waits for everything the listener handed to waitUntil/respondWith.
  const dispatch = async (type: string, event: Record<string, unknown> = {}) => {
    const pending: Promise<unknown>[] = [];
    const listener = listeners.get(type);
    if (!listener) throw new Error(`no listener for ${type}`);
    listener({ ...event, waitUntil: (p: Promise<unknown>) => pending.push(p), respondWith: (p: Promise<unknown>) => pending.push(p) });
    await Promise.all(pending);
  };
  return { caches, fetch, subscribe, dispatch };
}

const chunk = (i: number) => `/_next/static/chunks/${i}.js`;
const chunks = (count: number) => Array.from({ length: count }, (_, i) => chunk(i));
const calls = (fetch: ReturnType<typeof loadWorker>["fetch"]) =>
  fetch.mock.calls.map(([url, init]) => ({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined }));

const subscription = (endpoint: string, applicationServerKey: ArrayBuffer | null = null) => ({
  endpoint,
  options: { applicationServerKey },
  toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: "p256dh-key", auth: "auth-key" } }),
});

const okJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("service worker: build chunk cache", () => {
  it("keeps the 150 most recent chunks on activate and leaves icons, brand assets and pages alone", async () => {
    const { caches, dispatch } = loadWorker();
    const cache = await caches.open(VERSION);
    await cache.addAll(["/icons/icon-192.png", "/brand/taskly-monogram-graphite.svg", ...chunks(170)]);
    await caches.open("taskly-v1");
    await caches.open("taskly-pages");

    await dispatch("activate");

    const kept = cache.paths();
    expect(kept.filter((path) => path.startsWith("/_next/static/"))).toEqual(chunks(170).slice(20));
    expect(kept).toContain("/icons/icon-192.png");
    expect(kept).toContain("/brand/taskly-monogram-graphite.svg");
    expect(await caches.keys()).toEqual([VERSION, "taskly-pages"]);
  });

  it("prunes again each time the app opens, since activate only runs when this file changes", async () => {
    const { caches, fetch, dispatch } = loadWorker();
    const cache = await caches.open(VERSION);
    await cache.addAll(chunks(153));
    fetch.mockResolvedValue(new Response("<html>", { status: 200 }));

    await dispatch("fetch", { request: { method: "GET", mode: "navigate", url: `${ORIGIN}/today` } });

    expect(cache.paths()).toEqual(chunks(153).slice(3));
  });
});

describe("service worker: push subscription change", () => {
  it("subscribes again with the old server key, saves the new device and forgets the old one", async () => {
    const { fetch, subscribe, dispatch } = loadWorker();
    const key = new Uint8Array([1, 2, 3]).buffer;
    const fresh = subscription("https://push.example/new");
    subscribe.mockResolvedValue(fresh);
    fetch.mockResolvedValue(okJson({ ok: true }));

    await dispatch("pushsubscriptionchange", { oldSubscription: subscription("https://push.example/old", key), newSubscription: null });

    expect(subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: key });
    expect(calls(fetch)).toEqual([
      { url: "/api/push", method: "POST", body: { endpoint: "https://push.example/new", expirationTime: null, keys: { p256dh: "p256dh-key", auth: "auth-key" } } },
      { url: "/api/push", method: "DELETE", body: { endpoint: "https://push.example/old" } },
    ]);
    expect(fetch.mock.calls.every(([, init]) => init?.credentials === "include")).toBe(true);
  });

  it("fetches the server key when the old subscription is already gone", async () => {
    const { fetch, subscribe, dispatch } = loadWorker();
    subscribe.mockResolvedValue(subscription("https://push.example/new"));
    fetch.mockImplementation(async (_url, init) => (init?.method ? okJson({ ok: true }) : okJson({ publicKey: "AQID-_8" })));

    await dispatch("pushsubscriptionchange", { oldSubscription: null, newSubscription: null });

    expect(subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: new Uint8Array([1, 2, 3, 251, 255]) });
    expect(calls(fetch).map((call) => call.method)).toEqual(["GET", "POST"]);
  });

  it("uses the subscription the browser already made and keeps a row updated in place", async () => {
    const { fetch, subscribe, dispatch } = loadWorker();
    fetch.mockResolvedValue(okJson({ ok: true }));

    await dispatch("pushsubscriptionchange", {
      oldSubscription: subscription("https://push.example/same"),
      newSubscription: subscription("https://push.example/same"),
    });

    expect(subscribe).not.toHaveBeenCalled();
    expect(calls(fetch).map((call) => call.method)).toEqual(["POST"]);
  });

  it("keeps the old row when the new one could not be saved", async () => {
    const { fetch, subscribe, dispatch } = loadWorker();
    subscribe.mockResolvedValue(subscription("https://push.example/new"));
    fetch.mockResolvedValue(okJson({ error: "unauthorized" }, 401));

    await dispatch("pushsubscriptionchange", { oldSubscription: subscription("https://push.example/old", new ArrayBuffer(8)), newSubscription: null });

    expect(calls(fetch).map((call) => call.method)).toEqual(["POST"]);
  });

  it("never fails the event on a network error", async () => {
    const { fetch, subscribe, dispatch } = loadWorker();
    subscribe.mockResolvedValue(subscription("https://push.example/new"));
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(dispatch("pushsubscriptionchange", { oldSubscription: null, newSubscription: null })).resolves.toBeUndefined();
  });
});
