// Taskly service worker: offline fallback, static asset cache, push notifications.
// Plain JavaScript on purpose: it is served as-is from /sw.js.

const VERSION = "taskly-v2";
// The user's own pages, kept per device so the app opens offline with the last known day.
const PAGES = "taskly-pages";
const SHELL = ["/offline", "/icons/icon-192.png", "/brand/taskly-monogram-graphite.svg"];
const APP_PAGES = ["/today", "/agenda", "/lists", "/stats", "/review"];
// Hashed build chunks (/_next/static/). A build is about 35 files; a deploy never asks for the old
// ones again, so the cache keeps the most recent ones only: about four deploys' worth.
const CHUNK_LIMIT = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION && key !== PAGES).map((key) => caches.delete(key))))
      .then(pruneChunks)
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/");
const isChunk = (url) => url.pathname.startsWith("/_next/static/");

/**
 * Drops the oldest build chunks beyond CHUNK_LIMIT. Icons and brand assets stay.
 * Cache.keys() lists entries oldest first (put appends), so the slice is the stale end.
 * Runs on activate and on every app open: this file rarely changes, so activate alone
 * would let the cache grow with each deploy.
 */
async function pruneChunks() {
  const cache = await caches.open(VERSION);
  const chunks = (await cache.keys()).filter((request) => isChunk(new URL(request.url)));
  const stale = chunks.slice(0, Math.max(0, chunks.length - CHUNK_LIMIT));
  await Promise.all(stale.map((request) => cache.delete(request)));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: the network first. App pages are kept so they open offline
  // with the last known content; anything else falls back to /offline.
  if (request.mode === "navigate") {
    event.waitUntil(pruneChunks().catch(() => undefined));
    const keep = APP_PAGES.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (keep && response.ok && !response.redirected) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(async () => (keep && (await caches.match(url.pathname, { cacheName: PAGES }))) || caches.match("/offline")),
    );
    return;
  }

  // Hashed build assets and icons never change: cache first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});

// Push payload: { title, body, url?, tag?, badge? (number) }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Taskly", body: event.data ? event.data.text() : "" };
  }
  const tasks = [
    self.registration.showNotification(data.title || "Taskly", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/today", reminderId: data.reminderId },
      actions: data.actions || [],
    }),
  ];
  // The onboarding test: tell the server this device really received it.
  if (data.tag === "test") {
    tasks.push(
      fetch("/api/push/ack", { method: "POST", credentials: "include" })
        .catch(() => undefined)
        .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
        .then((windows) => windows.forEach((w) => w.postMessage({ type: "taskly:test-received" }))),
    );
  }
  if (typeof data.badge === "number" && "setAppBadge" in self.navigator) {
    tasks.push(data.badge > 0 ? self.navigator.setAppBadge(data.badge) : self.navigator.clearAppBadge());
  }
  event.waitUntil(Promise.all(tasks));
});

// The VAPID public key, as /api/push serves it (base64url), in the form subscribe() takes.
const base64UrlToBytes = (base64) => {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

const pushJson = (method, body) =>
  fetch("/api/push", { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });

/**
 * The browser dropped or rotated this device's subscription. Without this, every
 * reminder would silently stop: the server keeps pushing to an endpoint that is gone.
 * Subscribes again with the same server key and tells the server; the old row is only
 * removed once the new one is saved, so the device is never left without one.
 */
async function resubscribe(oldSubscription, newSubscription) {
  let subscription = newSubscription;
  if (!subscription) {
    let key = oldSubscription && oldSubscription.options && oldSubscription.options.applicationServerKey;
    if (!key) {
      const response = await fetch("/api/push", { credentials: "include" });
      if (!response.ok) return;
      key = base64UrlToBytes((await response.json()).publicKey);
    }
    subscription = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  }
  // What POST /api/push validates: endpoint, keys.p256dh, keys.auth (toJSON() has them).
  const saved = await pushJson("POST", subscription.toJSON());
  const oldEndpoint = oldSubscription && oldSubscription.endpoint;
  if (saved.ok && oldEndpoint && oldEndpoint !== subscription.endpoint) {
    await pushJson("DELETE", { endpoint: oldEndpoint });
  }
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(resubscribe(event.oldSubscription, event.newSubscription).catch(() => undefined));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url = "/today", reminderId } = event.notification.data || {};

  // Android action buttons: Done / Later, handled without opening the app.
  if (event.action && reminderId) {
    event.waitUntil(
      fetch("/api/reminders/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reminderId, action: event.action }),
      }).catch(() => undefined),
    );
    return;
  }

  // The morning briefing opens Claude; its "Open Taskly" button opens the app instead.
  const target = event.action === "open-app" ? "/today" : url;

  // Another site (claude.ai) opens in the browser or its own app, never inside Taskly's window.
  if (new URL(target, self.location.origin).origin !== self.location.origin) {
    event.waitUntil(self.clients.openWindow(target));
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

// Sign-out: forget the pages kept for offline use.
self.addEventListener("message", (event) => {
  if (event.data?.type === "taskly:clear-pages") event.waitUntil(caches.delete(PAGES));
});
