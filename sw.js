const CACHE_NAME = 'diary-app-v1.4'; // 每次修改此處版本號，手機就會重新偵測更新
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js?v=1.1',
  './manifest.json'
];

// 安裝 Service Worker 並快取檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截網路請求，確保離線時也能從快取抓取內容
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});