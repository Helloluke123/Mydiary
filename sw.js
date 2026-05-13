const CACHE_NAME = 'diary-app-v1.5';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js?v=1.5',
  './manifest.json?v=1.5'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});