// Service Worker 文件：sw.js
const CACHE_VERSION = 'v3.0';
const CACHE_NAME = `一键工达-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  // 添加其他核心资源路径
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存核心资源');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
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
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker 激活');
      return self.clients.claim();
    })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 对HTML文档使用网络优先策略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // 更新缓存
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // 网络不可用时使用缓存
          return caches.match('/index.html');
        })
    );
  } else {
    // 其他资源使用缓存优先策略
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(event.request);
        })
    );
  }
});

// 监听消息事件（用于跳过等待）
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});