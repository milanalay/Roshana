// Roshana Service Worker — stale-while-revalidate strategy
// ─────────────────────────────────────────────────────────────
// HOW THIS WORKS:
//   1. Serve cached version instantly (fast load)
//   2. Simultaneously fetch fresh version from network in background
//   3. Store fresh version in cache for NEXT visit
//   4. On next open, the fresh version is served automatically
//
// UPDATING: bump CACHE_VERSION on every deploy so old caches are purged.
// ─────────────────────────────────────────────────────────────

const CACHE_VERSION = 'roshana-v2';
const CACHE_NAME = `cache-${CACHE_VERSION}`;

// Core shell assets — pre-cached on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install: pre-cache shell, activate immediately ───────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: delete ALL old caches ──────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate ────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {

        // Always fetch fresh copy from network in the background
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type !== 'opaque'
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return cache.match('/index.html');
            }
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });

        // Return cached immediately if available, otherwise wait for network
        return cachedResponse || networkFetch;
      });
    })
  );
});

// ── Message handler: allow manual cache skip ─────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
