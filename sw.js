/**
 * Service Worker — app-shell offline support + fast loads.
 * Strategy: cache-first for same-origin app shell; network-first (with cache fallback) for
 * everything else (incl. CDN libs & fonts). Bump CACHE_VERSION when shipping changes.
 */
const CACHE_VERSION = 'its-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/css/invoice-base.css',
  './assets/sample-invoice.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './src/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => {})).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network-first for everything: always serve the latest deploy when online, fall back to the
// cache only when offline. This avoids serving stale JS/CSS after an update (the previous
// cache-first strategy for same-origin caused old code to persist between deploys).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req)),
  );
});
