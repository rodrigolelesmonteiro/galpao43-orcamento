// Galpão 43 — Service Worker v2.0
// Atualizado automaticamente — cache sempre busca versão mais recente da rede

const CACHE_NAME = 'galpao43-v2';
const ASSETS = [
  '/galpao43-orcamento/',
  '/galpao43-orcamento/index.html',
  '/galpao43-orcamento/manifest.json',
];

// Instalação: abre novo cache e já pula espera
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

// Ativação: apaga TODOS os caches antigos imediatamente
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] Removendo cache antigo:', k);
              return caches.delete(k);
            })
      );
    }).then(function() {
      console.log('[SW] Cache novo ativo:', CACHE_NAME);
      return self.clients.claim(); // assume controle imediato de todas as abas
    })
  );
});

// Fetch: estratégia Network First
// Sempre tenta buscar da rede primeiro.
// Só usa o cache se a rede falhar (modo offline).
self.addEventListener('fetch', function(event) {
  // Ignora requisições não-GET e extensões do Chrome
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Resposta válida da rede: atualiza o cache e retorna
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Rede falhou (offline): tenta servir do cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/galpao43-orcamento/index.html');
        });
      })
  );
});
