const CACHE_NAME = 'inkverse-cache-v1';

// 预缓存资源列表
const INITIAL_CACHED_RESOURCES = [
  './',
  './index.html',
  './favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(INITIAL_CACHED_RESOURCES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
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
  self.clients.claim();
});

/**
 * 拦截 Fetch 请求
 * 策略：网络优先 (Network First)，网络失败后回落到缓存 (Cache Fallback)
 * 同时将成功的网络请求直接存入缓存，以保证下次离线时可用
 */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // 跳过扩展或跨域非预期请求
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('cdn')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 请求成功后，拷贝一份放入缓存
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 请求失败（离线等情况），从缓存中寻找
        return caches.match(event.request);
      })
  );
});
