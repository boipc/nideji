// Service Worker 文件：sw.js
const CACHE_VERSION = 'v3.2';
const CACHE_NAME = `一键工达-${CACHE_VERSION}`;
const OFFLINE_URL = './index.html';
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/chart.js'
];
const NETWORK_TIMEOUT = 1500; // 1.5秒网络超时

// 安装事件 - 预缓存关键资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('预缓存关键资源');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
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
          if (cacheName !== CACHE_NAME && cacheName.startsWith('一键工达-')) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('立即控制客户端');
      return self.clients.claim();
    })
  );
});

// 带超时的fetch请求
const fetchWithTimeout = (request, timeout) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeout);
    
    fetch(request).then(response => {
      clearTimeout(timeoutId);
      resolve(response);
    }).catch(err => {
      clearTimeout(timeoutId);
      reject(err);
    });
  });
};

// 拦截请求 - 优化缓存策略
self.addEventListener('fetch', event => {
  // 处理导航请求
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async function() {
        // 优先从缓存获取
        const cachedResponse = await caches.match(OFFLINE_URL);
        if (cachedResponse) {
          // 后台更新缓存
          event.waitUntil(
            (async function() {
              try {
                const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse.clone());
                
                // 检测是否有新版本
                const clientList = await self.clients.matchAll();
                clientList.forEach(client => {
                  client.postMessage({
                    type: 'UPDATE_AVAILABLE',
                    version: CACHE_VERSION
                  });
                });
              } catch (error) {
                // 更新失败可忽略
              }
            })()
          );
          return cachedResponse;
        }
        
        // 没有缓存则尝试网络请求
        try {
          const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // 网络失败时使用离线页面
          return caches.match(OFFLINE_URL) || Response.error();
        }
      })()
    );
  } else {
    // 其他资源使用Stale-While-Revalidate策略
    event.respondWith(
      (async function() {
        const cachedResponse = await caches.match(event.request);
        
        // 后台更新缓存
        const updateCache = async () => {
          try {
            const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
          } catch (error) {
            // 更新失败可忽略
          }
        };
        
        // 如果有缓存立即返回，同时更新缓存
        if (cachedResponse) {
          event.waitUntil(updateCache());
          return cachedResponse;
        }
        
        // 没有缓存则从网络获取
        try {
          const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          return Response.error();
        }
      })()
    );
  }
});

// 处理消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // 强制更新命令
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    caches.delete(CACHE_NAME).then(() => {
      self.registration.update();
      self.skipWaiting();
    });
  }
});