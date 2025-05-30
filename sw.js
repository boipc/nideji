// 缓存名称
const CACHE_NAME = 'salary-calculator-v1';
// 需要缓存的资源
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // 图标资源
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// 安装Service Worker
self.addEventListener('install', event => {
  // 执行安装步骤：打开缓存，缓存文件
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已打开缓存');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  // 删除旧的缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求并从缓存中返回
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，则返回缓存
        if (response) {
          return response;
        }
        
        // 否则从网络请求
        return fetch(event.request)
          .then(response => {
            // 检查是否接收到有效响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应
            const responseToCache = response.clone();

            // 将新资源添加到缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 如果离线且请求失败，返回默认页面
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});