// Hum service worker — offline cache + auto-update.
// Registered from index.html as ./sw.js (must be a real same-origin file:
// browsers reject blob:/data: service worker script URLs).
const CACHE = 'hum-v12';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for immutable assets (fonts, versioned CDN libs, ML model chunks).
// Once fetched, they never change, so serving from cache enables true offline use.
function cacheFirst(request) {
  return caches.match(request).then(hit => hit || fetch(request).then(r => {
    if (r && (r.ok || r.type === 'opaque')) {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
    }
    return r;
  }));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = e.request.url;

  // Never cache API calls (transcription, Google Drive) — always live
  if (u.includes('api.groq.com') || u.includes('api.openai.com') ||
      u.includes('googleapis.com') || u.includes('accounts.google.com')) {
    return; // default network handling
  }

  // Fonts, versioned CDN libraries, and the TF.js/SPICE model: cache-first (immutable)
  if (u.includes('fonts.g') || u.includes('cdn.jsdelivr.net') ||
      u.includes('esm.sh') || u.includes('tfhub.dev') || u.includes('kaggle')) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // App shell (HTML): stale-while-revalidate, bypassing the browser HTTP cache
  if (u.endsWith('.html') || u.endsWith('/') || !u.includes('.')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        const refresh = fetch(new Request(u, { cache: 'no-cache' }))
          .then(async r => {
            if (!r || !r.ok) return r;
            const newTag = r.headers.get('etag') || r.headers.get('last-modified');
            const oldTag = cached && (cached.headers.get('etag') || cached.headers.get('last-modified'));
            await cache.put(e.request, r.clone());
            if (cached && newTag && oldTag && newTag !== oldTag) {
              const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
              clients.forEach(c => c.postMessage({ type: 'SW_UPDATE' }));
            }
            return r;
          }).catch(() => null);
        return cached || refresh.then(r => r || new Response('App offline — check your connection', { status: 503, headers: { 'Content-Type': 'text/plain' } }));
      })
    );
    return;
  }

  // Same-origin static assets (manifest, icons): cache-first
  if (new URL(u).origin === self.location.origin) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // Everything else: network pass-through
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 408 })));
});
