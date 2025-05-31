// sw.js - Service Worker 文件
const CACHE_NAME = 'salary-calculator-v3.0';
const OFFLINE_URL = 'offline.html';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 缓存核心文件');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker 并清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活');
  
  // 清理旧版本缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 立即接管所有客户端
  self.clients.claim();
});

// 拦截请求并返回缓存内容
self.addEventListener('fetch', event => {
  // 处理导航请求的特殊情况
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 网络请求失败时返回缓存的index.html
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 处理其他请求
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有资源，则返回缓存内容
        if (response) {
          return response;
        }
        
        // 否则从网络请求
        return fetch(event.request)
          .then(response => {
            // 检查响应是否有效
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应以进行缓存
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 对于非导航请求，返回错误响应
            return new Response('离线不可用', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({'Content-Type': 'text/plain'})
            });
          });
      })
  );
});

// 监听消息事件
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});