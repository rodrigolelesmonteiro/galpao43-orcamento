// Galpão 43 — Service Worker v1.0
const CACHE_NAME = 'galpao43-v1';
const ASSETS = [
  '/galpao43-orcamento/',
  '/galpao43-orcamento/index.html',
  '/galpao43-orcamento/manifest.json',
];

// Instalação: faz cache dos arquivos principais
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Ativação: remove caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: serve do cache se disponível, senão busca na rede
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Armazena no cache se for um recurso válido
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        // Offline fallback: retorna o index.html do cache
        return caches.match('/galpao43-orcamento/index.html');
      });
    })
  );
});
