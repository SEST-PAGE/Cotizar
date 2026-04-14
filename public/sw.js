// ============================================================
// SEST - Service Worker v4 - Fix redirect handling
// ============================================================
const CACHE_NAME = 'sest-v4';
const CACHE_STATIC = 'sest-static-v4';

const PRECACHE_URLS = [
  '/dashboard.html',
  '/index.html',
];

// ── Instalación ─────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar caches viejos ───────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET del mismo origen
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API → siempre red, nunca cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { redirect: 'follow' }).catch(() =>
        new Response(
          JSON.stringify({ error: 'Sin conexión.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Assets estáticos → Network-first con fallback a cache
  event.respondWith(
    fetch(request, { redirect: 'follow' })
      .then(networkRes => {
        // Solo cachear respuestas válidas (no redirects, no errores)
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const cloned = networkRes.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, cloned));
        }
        return networkRes;
      })
      .catch(async () => {
        // Sin red → buscar en cache
        const cached = await caches.match(request);
        if (cached) return cached;

        // Fallback HTML
        if (request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }

        return new Response('Sin conexión', { status: 503 });
      })
  );
});
