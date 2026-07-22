const CACHE_NAME = 'equipmaster-v4';
const STATIC_CACHE = 'equipmaster-static-v4';
const API_CACHE = 'equipmaster-api-v4';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
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

  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    fetch(request).then(res => {
      if (res.ok && request.method === 'GET') {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(request, clone));
      }
      return res;
    }).catch(() => caches.match(request))
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
