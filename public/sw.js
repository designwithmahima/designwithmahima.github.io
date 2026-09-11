const CACHE_NAME = 'mahima-g-v2';
const ASSETS = [
  './',
  './index.html',
  './splash.html',
  './favicon.png',
  './manifest.json',
  './assets/mahima_gupta_resume.pdf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Pages, scripts and styles must prefer the network so a new deployment is
  // visible immediately. Fall back to cache only when the visitor is offline.
  const destination = event.request.destination;
  const networkFirst = event.request.mode === 'navigate'
    || destination === 'script'
    || destination === 'style';

  if (networkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Images and other static files stay fast while refreshing in the background.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const refreshed = fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
      return cachedResponse || refreshed;
    })
  );
});
