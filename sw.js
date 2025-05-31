// sw.js - Service Worker 文件
const CACHE_NAME = 'salary-calculator-v2.0';
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
  // 处理API请求或外部资源
  if (event.request.url.includes('http') && !event.request.url.startsWith(self.location.origin)) {
    return fetch(event.request);
  }
  
  // 处理本地资源请求
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有资源，则返回缓存内容
        if (response) {
          console.log(`[Service Worker] 从缓存返回: ${event.request.url}`);
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
                console.log(`[Service Worker] 缓存新资源: ${event.request.url}`);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            // 网络请求失败时返回离线页面
            console.error('[Service Worker] 获取失败:', error);
            return caches.match('./index.html');
          });
      })
  );
});

// 监听消息事件（用于更新UI）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});