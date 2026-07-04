// ── Service Worker for StudyMind PWA ──────────────────
const CACHE_NAME = 'studymind-v1';

const urlsToCache = [
  '/pages/index.html',
  '/css/landing.css',
  '/js/landing.js',
  '/manifest.json',
];

// ── Install — cache basic files ───────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Ignore errors for files that don't exist yet
      });
    })
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ───────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME)
             .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch — network first, fallback to cache ──────────
self.addEventListener('fetch', (event) => {
  // Don't cache API calls — always fetch fresh data
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — try cache
        return caches.match(event.request);
      })
  );
}); 
