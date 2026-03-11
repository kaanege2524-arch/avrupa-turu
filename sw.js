const CACHE = 'avrupa-v4';
const URLS = ['/index.html', '/manifest.json', '/sw.js'];

// Install: cache her şeyi
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(URLS.map(url => cache.add(url)));
    })
  );
});

// Activate: eski cache'leri sil
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: iOS için cache-first, fallback index.html
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Dış servisler — cache'leme
  if (!url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      // Önce cache'e bak
      const cached = await cache.match(e.request);
      if (cached) return cached;

      // Cache'de yok — ağdan al ve kaydet
      try {
        const res = await fetch(e.request);
        if (res && res.status === 200 && e.request.method === 'GET') {
          cache.put(e.request, res.clone());
        }
        return res;
      } catch {
        // Ağ yok — index.html döndür (iOS için kritik)
        const fallback = await cache.match('/index.html');
        return fallback || new Response('Çevrimdışı', {status: 503});
      }
    })
  );
});
