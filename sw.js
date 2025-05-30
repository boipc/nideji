// 缓存名称
const CACHE_NAME = 'salary-calculator-v2.1';
// 需要缓存的资源
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // 其他需要缓存的资源
];

// 安装阶段
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开，正在添加资源');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
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

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有，返回缓存内容
        if (response) {
          return response;
        }
        
        // 否则从网络获取
        return fetch(event.request)
          .then(response => {
            // 检查是否收到有效响应
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应流
            const responseToCache = response.clone();
            
            // 将新资源加入缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// 监听消息（用于更新缓存）
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});