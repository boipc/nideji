// Service Worker 文件：sw.js
const CACHE_VERSION = 'v3.1';
const CACHE_NAME = `一键工达-${CACHE_VERSION}`;
const OFFLINE_URL = './index.html';
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装事件 - 预缓存关键资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('预缓存关键资源');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // 跳过等待阶段
        console.log('跳过等待阶段');
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
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
      // 立即控制所有客户端
      console.log('立即控制客户端');
      return self.clients.claim();
    })
  );
});

// 拦截请求 - 使用Stale-While-Revalidate策略
self.addEventListener('fetch', event => {
  // 处理导航请求
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async function() {
        try {
          // 优先从网络获取
          const networkResponse = await fetch(event.request);
          // 更新缓存
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // 网络失败时使用缓存
          const cachedResponse = await caches.match(OFFLINE_URL);
          return cachedResponse || Response.error();
        }
      })()
    );
  } else {
    // 其他资源使用缓存优先策略
    event.respondWith(
      (async function() {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          // 后台更新缓存
          event.waitUntil(
            (async function() {
              try {
                const networkResponse = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
              } catch (error) {
                // 更新失败可忽略
              }
            })()
          );
          return cachedResponse;
        }
        // 没有缓存则从网络获取
        return fetch(event.request);
      })()
    );
  }
});

// 处理消息 - 支持跳过等待
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});