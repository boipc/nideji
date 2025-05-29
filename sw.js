// sw.js
const CACHE_NAME = 'salary-calculator-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // 如果有其他资源（如CSS、JS、图片），也在这里添加
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request))
      .then(response => response || fetch(event.request))
  );
});