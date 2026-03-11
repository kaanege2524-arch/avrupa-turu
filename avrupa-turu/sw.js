const CACHE = 'avrupa-turu-v1';

// Cache edilecek kaynaklar
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js'
];

// Kurulum — tüm kaynakları önbelleğe al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log('Kaynaklar önbelleğe alınıyor...');
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => console.warn('Cache miss:', url, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Aktivasyon — eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — önce cache, yoksa network, o da yoksa offline sayfası
self.addEventListener('fetch', e => {
  // Chrome extension ve non-http isteklerini atla
  if (!e.request.url.startsWith('http')) return;
  // Anthropic API isteklerini (AI) önbelleğe alma, doğrudan geç
  if (e.request.url.includes('anthropic.com')) return;
  // Google Maps linklerini geç
  if (e.request.url.includes('google.com/maps')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        // Başarılı GET isteklerini cache'e ekle
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Hem cache hem network yoksa index.html döndür
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
