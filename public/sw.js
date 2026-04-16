// ══════════════════════════════════════════════════════════════
//  SEST · Service Worker  v1.2
//  Estrategia:
//    • Assets estáticos  → Cache First  (rápido, offline OK)
//    • Llamadas /api/*   → Network First (datos siempre frescos)
//    • Resto             → Network First con fallback a cache
// ══════════════════════════════════════════════════════════════

const CACHE_NAME   = 'sest-v1.2';
const OFFLINE_PAGE = '/dashboard.html';   // fallback si no hay red

// Archivos que se precargan al instalar el SW
const PRECACHE_ASSETS = [
  '/',
  '/dashboard.html',
  '/IVAConfig.js',
  '/logo.jpg',
];

// ── INSTALL: precarga assets clave ───────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(
        PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' }))
      );
    }).then(() => self.skipWaiting())
     .catch(() => self.skipWaiting()) // si falla precache, no bloquear
  );
});

// ── ACTIVATE: elimina caches viejos ──────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia por tipo de recurso ─────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no son GET (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') return;

  // Ignorar extensiones de Chrome y peticiones no-http
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.startsWith('/chrome-extension')) return;

  // ── /api/* → Network First: siempre intentar red primero ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Assets estáticos → Cache First ────────────────────────
  const isStaticAsset = /\.(js|css|woff2?|ttf|otf|eot|jpg|jpeg|png|gif|svg|ico|webp)$/i.test(url.pathname);
  if (isStaticAsset) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── HTML y resto → Network First con fallback ─────────────
  event.respondWith(networkFirstWithFallback(request));
});

// ─────────────────────────────────────────────────────────────
//  Helpers de estrategia
// ─────────────────────────────────────────────────────────────

/** Cache First: devuelve caché si existe, si no va a red y guarda */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso no disponible offline', { status: 503 });
  }
}

/** Network First: intenta red, si falla usa caché */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ _err: true, msg: 'Sin conexión con el servidor' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/** Network First con fallback a página offline para navegación */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback: mostrar dashboard cacheado
    const fallback = await caches.match(OFFLINE_PAGE);
    if (fallback) return fallback;
    return new Response(
      '<h1 style="font-family:sans-serif;padding:2rem">Sin conexión</h1>',
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ── Mensaje desde la página para forzar actualización ─────────
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});