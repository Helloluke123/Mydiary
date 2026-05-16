const CACHE_NAME = 'diary-app-v2.0'; // 1. 升級版本號，告訴瀏覽器有新東西了
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './manifest.json'
];

// 安裝時強制跳過等待，立刻讓新 Service Worker 接管
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 激活時自動刪除「舊版本」的快取資料夾 (清空舊的 v1.7)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('正在刪除舊快取:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 核心修正：改用「網路優先 (Network First)」策略
// 先去 GitHub 抓最新的網頁，抓成功就順便更新快取；只有在斷線（離線）時，才去翻舊快取。
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果網路正常，複製一份最新的放進快取
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 只有在網路斷線、發生錯誤時，才吃快取檔案
        return caches.match(event.request);
      })
  );
});