const CACHE_NAME = 'diary-app-v1.1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js?v=1.1',
  './manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截請求，讓 App 在離線時也能開啟
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});