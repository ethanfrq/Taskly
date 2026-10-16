// Taskly service worker: offline fallback, static asset cache, push notifications.
// Plain JavaScript on purpose: it is served as-is from /sw.js.

const VERSION = "taskly-v2";
// The user's own pages, kept per device so the app opens offline with the last known day.
const PAGES = "taskly-pages";
const SHELL = ["/offline", "/icons/icon-192.png", "/brand/taskly-monogram-graphite.svg"];
const APP_PAGES = ["/today", "/agenda", "/lists", "/stats", "/review"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION && key !== PAGES).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/");

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: the network first. App pages are kept so they open offline
  // with the last known content; anything else falls back to /offline.
  if (request.mode === "navigate") {
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

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});

// Sign-out: forget the pages kept for offline use.
self.addEventListener("message", (event) => {
  if (event.data?.type === "taskly:clear-pages") event.waitUntil(caches.delete(PAGES));
});
