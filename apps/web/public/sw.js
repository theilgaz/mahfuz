/// <reference lib="webworker" />

const CACHE_VERSION = "20260424";
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

  // Cache-first helper — returns cached response or fetches, caches, and returns
  function respondCacheFirst(req) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then(
          (cached) =>
            cached ||
            fetch(req).then((response) => {
              if (response.ok) cache.put(req, response.clone());
              trimCacheThrottled(CACHE_NAME, MAX_CACHE_ITEMS);
              return response;
            }),
        ),
      ),
    );
  }

  // QCF fonts from CDN — cache-first (cross-origin, immutable)
  if (url.origin === "https://verses.quran.foundation" && url.pathname.endsWith(".woff2")) {
    respondCacheFirst(request);
    return;
  }

  // Google Fonts — cache-first (cross-origin)
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    respondCacheFirst(request);
    return;
  }

  // Skip other external requests
  if (url.origin !== self.location.origin) return;

  // Immutable content — cache-first (fonts, quran data, translations, mushaf, tajweed, imlaei, images)
  // Keep in sync with server.mjs IMMUTABLE_PREFIXES
  if (
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/quran/") ||
    url.pathname.startsWith("/translations/") ||
    url.pathname.startsWith("/mushaf-lines/") ||
    url.pathname.startsWith("/mushaf-pages/") ||
    url.pathname.startsWith("/mushaf-images/") ||
    url.pathname.startsWith("/qcf-words/") ||
    url.pathname.startsWith("/tajweed/") ||
    url.pathname.startsWith("/imlaei/") ||
    url.pathname.startsWith("/models/")
  ) {
    respondCacheFirst(request);
    return;
  }

  // JS/CSS assets (hashed filenames) — cache-first
  if (url.pathname.startsWith("/assets/")) {
    respondCacheFirst(request);
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
