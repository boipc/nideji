// sw.js - Service Worker 文件
const CACHE_NAME = 'salary-calculator-v3.3';
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
      .then(() => self.skipWaiting()) // 强制立即激活
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
    }).then(() => self.clients.claim()) // 立即接管所有客户端
  );
});

// 拦截请求并返回缓存内容
self.addEventListener('fetch', event => {
  // 处理导航请求（页面刷新）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then(response => {
          // 优先返回缓存的index.html
          return response || fetch(event.request);
        })
    );
  } else {
    // 处理其他请求（如图片、图标等）
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // 返回缓存内容或网络请求
          return response || fetch(event.request);
        })
    );
  }
});

// 监听消息事件（用于更新UI）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});