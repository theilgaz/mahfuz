/// <reference lib="webworker" />

const CACHE_NAME = "mahfuz-v1";
const STATIC_ASSETS = ["/", "/manifest.json"];

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

// Fetch — network-first for navigation & API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // Font files + Quran JSON — cache-first (immutable content)
  if (
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/quran/") ||
    url.pathname.startsWith("/translations/")
  ) {
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
          // Başarılı yanıtı cache'le
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

  // Server functions — network-only (DB bağımlı, cache'lenemez)
  if (url.pathname.startsWith("/_server")) {
    return;
  }
});
