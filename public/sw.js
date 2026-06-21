// Minimal service worker — makes the app installable + last numbers visible offline.
// Bump CACHE to invalidate on a breaking change.
const CACHE = 'rw-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // API: network-first, fall back to last cached response (offline = last seen numbers)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res })
        .catch(() => caches.match(request))
    )
    return
  }

  // Page navigations: network-first so deploys show immediately, cache as offline fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res })
        .catch(() => caches.match(request).then((c) => c || caches.match('/')))
    )
    return
  }

  // Static assets: cache-first, then network
  e.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res
      })
    )
  )
})
