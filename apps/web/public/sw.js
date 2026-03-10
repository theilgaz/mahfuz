/// @ts-nocheck
const CACHE_NAME = "mahfuz-v3";

const APP_SHELL = [
  "/",
  "/surah",
  "/fonts/KFGQPCUthmanicScriptHAFS.woff2",
];

// Install: pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API calls: stale-while-revalidate (Quran data is static, serve from cache instantly)
  if (url.hostname === "api.quran.com" || url.hostname === "api.qurancdn.com") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static Quran text + translations: cache-first (immutable files)
  if (url.pathname.startsWith("/quran/") || url.pathname.startsWith("/translations/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static assets (fonts, images, CSS, JS): cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation: network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached || new Response("Offline", { status: 503 }));

  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }

    return new Response("Offline", { status: 503 });
  }
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)(\?.*)?$/.test(url.pathname);
}
