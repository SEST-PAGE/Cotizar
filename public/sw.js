const CACHE_NAME = 'sest-v4';
const CACHE_STATIC = 'sest-static-v4';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request, { redirect: 'follow' })
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          caches.open(CACHE_STATIC).then(c => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Sin conexión', { status: 503 });
      })
  );
});