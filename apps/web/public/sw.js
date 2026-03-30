/// <reference lib="webworker" />

const CACHE_VERSION = "20260330";
const CACHE_NAME = `mahfuz-${CACHE_VERSION}`;
const STATIC_ASSETS = ["/", "/manifest.json"];
const MAX_CACHE_ITEMS = 500;

// Install — precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Trim cache to prevent unbounded growth (throttled to once per 60s)
let lastTrimTime = 0;
async function trimCacheThrottled(cacheName, maxItems) {
  const now = Date.now();
  if (now - lastTrimTime < 60000) return;
  lastTrimTime = now;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const toDelete = keys.length - maxItems;
    await Promise.all(keys.slice(0, toDelete).map((k) => cache.delete(k)));
  }
}

// Fetch — network-first for navigation & API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // Immutable content — cache-first (fonts, quran data, translations, mushaf, tajweed, imlaei)
  if (
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/quran/") ||
    url.pathname.startsWith("/translations/") ||
    url.pathname.startsWith("/mushaf-lines/") ||
    url.pathname.startsWith("/tajweed/") ||
    url.pathname.startsWith("/imlaei/") ||
    url.pathname.startsWith("/models/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              trimCacheThrottled(CACHE_NAME, MAX_CACHE_ITEMS);
              return response;
            }),
        ),
      ),
    );
    return;
  }

  // JS/CSS assets (hashed filenames) — cache-first
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              return response;
            }),
        ),
      ),
    );
    return;
  }

  // Navigation — network-first, fallback to cached root (SPA shell)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  // Server functions — network-only (DB dependent, cannot cache)
  if (url.pathname.startsWith("/_server")) {
    return;
  }
});
