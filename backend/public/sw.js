const CACHE_NAME = 'equipmaster-v3';
const STATIC_CACHE = 'equipmaster-static-v3';
const API_CACHE = 'equipmaster-api-v3';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login',
  '/consulta',
  '/favicon.svg',
  '/logo-empresa.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).then(res => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone();
          caches.open(API_CACHE).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(request));
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        fetch(request).then(res => {
          if (res.ok) {
            caches.open(STATIC_CACHE).then(c => c.put(request, res));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(res => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        }
        return res;
      });
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
