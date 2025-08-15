// sw.js (Service Worker)
const CACHE_VERSION = 'v3.0';
const CACHE_NAME = `一键工达-${CACHE_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './icon.png',
  './manifest.json',
  './assets/js/chart.umd.min.js'
];

// 安装事件 - 预缓存所有必要资源
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求 - 使用缓存优先策略
self.addEventListener('fetch', event => {
  // 对于导航请求使用网络优先策略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 更新缓存
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // 其他资源使用缓存优先策略
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});