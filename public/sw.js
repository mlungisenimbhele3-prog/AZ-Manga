// OVERVERSE Progressive Web App Service Worker (Fallback / Static Reference)
const CACHE_NAME = 'oververse-pwa-v10';
const IMAGE_CACHE_NAME = 'oververse-manga-images';
const MAX_IMAGE_CACHE_ENTRIES = 180;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/master-logo.png',
  '/assets/aistudio/IMG-20261030-WA4361_fe49230b.jpg',
  '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp'
];

function trimCache(cacheName, maxEntries) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxEntries) {
        const overflow = keys.length - maxEntries;
        for (let i = 0; i < overflow; i += 1) {
          cache.delete(keys[i]);
        }
      }
    });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[OVERVERSE SW] Precache partial warning:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE_NAME &&
                key !== IMAGE_CACHE_NAME &&
                !key.startsWith('workbox-')
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  const isGoogleFont =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (
    (!isGoogleFont && url.hostname.includes('googleapis.com')) ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebasestorage.app') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/__/') ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/dev-sw.js') ||
    url.pathname.startsWith('/workbox-') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/__vite') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    /\.(aab|apk|keystore|sha256)$/i.test(url.pathname)
  ) {
    return;
  }

  // Google Fonts: Cache-First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Manga covers, chapter pages, and icons: Cache-First for instant preloaded page turns on slow networks
  if (
    request.destination === 'image' ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
              cache.put(request, copy).then(() => {
                trimCache(IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_ENTRIES);
              });
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // App navigation: Network-First with offline shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // Only cache same-origin static scripts, styles, and manifest
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
