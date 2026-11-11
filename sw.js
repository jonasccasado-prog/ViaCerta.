/* ViaCerta — offline para dados salvos localmente. Não rastreia localização. */
const CACHE = 'viacerta-pwa-shell-1-5-2';
const BASE = self.registration.scope;
const FILES = ['./', './index.html', './manifest.webmanifest', './viacerta-logo-192-v2.png', './viacerta-logo-512-v2.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Não apagar caches de outros aplicativos no mesmo github.io.
    await Promise.all(keys.filter((k) => k.startsWith('viacerta-pwa-shell-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Sem interceptar Google Maps, APIs de terceiros ou outros sites no GitHub Pages.
  if (url.origin !== self.location.origin || !url.href.startsWith(BASE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      const cached = await cache.match(request, {ignoreSearch: true});
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return (await cache.match('./index.html')) || Response.error();
      }
      return Response.error();
    }
  })());
});
