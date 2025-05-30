const CACHE_NAME = 'salary-calculator-v1.0.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活Service Worker

self.addEventListener('activate', event => {


// 删除旧缓存
event.waitUntil(
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    );
  })
);

// 拦截请求并返回缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存，则返回缓存

if (response) {

return response;

}

// 否则从网络请求

return fetch(event.request);

})

);

});