// Service Worker 文件：sw.js
const CACHE_VERSION = 'v1.0';
const CACHE_NAME = `一键工达-${CACHE_VERSION}`;
const urlsToCache = [
  './',
  './index.html'
];

// 安装事件
self.addEventListener('install', event => {
  // 跳过等待阶段
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除旧版本缓存
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 网络优先策略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 更新缓存
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 网络不可用时使用缓存
          return caches.match('./index.html');
        })
    );
  } else {
    // 其他资源使用缓存优先策略
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});