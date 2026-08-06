// Hum service worker — offline cache + auto-update.
// Registered from index.html as ./sw.js (must be a real same-origin file:
// browsers reject blob:/data: service worker script URLs).

// Two caches, because they have opposite lifetimes.
//
// SHELL holds the app itself and is replaced wholesale every release — that is
// the point of versioning it.
//
// ASSETS holds things whose URL already names their version: the pitch model in
// this repo, and CDN files pinned to an exact package version. A stale entry is
// impossible, since a different version would be a different URL. Keeping them
// across releases matters more than it sounds: melody analysis pulls 2.85 MB
// (2.4 of it the ONNX runtime's wasm binary), and the old single-cache scheme
// deleted all of it on every version bump — six times in one day of work, each
// one silently leaving an installed app unable to analyse until it next had a
// network. Version this only if the pinned versions above ever change.
const SHELL = 'hum-shell-v14-4';
const ASSETS = 'hum-assets-1';

const SHELL_FILES = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
];

const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
// Exactly what a cold melody analysis fetches, measured rather than guessed.
const ASSET_FILES = [
  './swiftf0.onnx',                       // 389 KB — the pitch model
  ORT + 'ort.wasm.min.mjs',               //  16 KB — WASM-only ORT build
  ORT + 'ort-wasm-simd-threaded.mjs',     //  10 KB — its loader
  ORT + 'ort-wasm-simd-threaded.wasm',    // 2.4 MB — the runtime itself
  'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js',        // 53 KB — MP3 on save
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',  // 29 KB — ZIP backup
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    // The shell must be complete or there is no app; let a failure here fail
    // the install so a half-cached version never activates.
    await (await caches.open(SHELL)).addAll(SHELL_FILES);

    // The 2.85 MB is fetched here rather than on first use: installing is the
    // moment the user has already decided they want this, and asking again for
    // three megabytes is invented ceremony. Best-effort though — one CDN hiccup
    // must not block the update, and anything missing is fetched on demand by
    // the handler below.
    const assets = await caches.open(ASSETS);
    await Promise.allSettled(ASSET_FILES.map(async url => {
      if (await assets.match(url)) return; // already here from a previous release
      const r = await fetch(url);
      if (r && (r.ok || r.type === 'opaque')) await assets.put(url, r);
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== ASSETS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for immutable assets (fonts, versioned CDN libs, the pitch model).
// Once fetched they never change, so serving from cache enables true offline use.
function cacheFirst(request, cacheName) {
  return caches.match(request).then(hit => hit || fetch(request).then(r => {
    if (r && (r.ok || r.type === 'opaque')) {
      const copy = r.clone();
      caches.open(cacheName).then(c => c.put(request, copy));
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

  // Fonts and version-pinned CDN libraries (onnxruntime-web + its wasm,
  // basic-pitch, TF.js, lamejs, JSZip): cache-first into the durable cache.
  if (u.includes('fonts.g') || u.includes('cdn.jsdelivr.net') || u.includes('esm.sh')) {
    e.respondWith(cacheFirst(e.request, ASSETS));
    return;
  }

  // App shell (HTML): stale-while-revalidate, bypassing the browser HTTP cache
  if (u.endsWith('.html') || u.endsWith('/') || !u.includes('.')) {
    e.respondWith(
      caches.open(SHELL).then(async cache => {
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

  // Same-origin static assets. The pitch model is durable (its bytes are tied to
  // the release that shipped them); icons and manifest belong with the shell.
  if (new URL(u).origin === self.location.origin) {
    e.respondWith(cacheFirst(e.request, u.endsWith('.onnx') ? ASSETS : SHELL));
    return;
  }

  // Everything else: network pass-through
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 408 })));
});
