// Service worker for Spanish B1→B2 app
// Strategy: cache-first for Next.js immutable static assets;
// network-only for everything else (auth-gated pages don't cache safely).

const CACHE = 'spanish-app-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e

  // Only handle GET requests
  if (request.method !== 'GET') return

  // Cache-first for Next.js static assets (immutable, content-hashed filenames)
  if (request.url.includes('/_next/static/')) {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            // Only cache successful responses
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, clone))
            }
            return res
          })
      )
    )
  }
  // All other requests (navigation, API calls) go straight to the network.
  // This keeps auth-gated pages working correctly.
})
