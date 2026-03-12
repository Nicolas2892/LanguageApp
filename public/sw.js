// Service worker for Spanish B1→B2 app
// Strategy:
//   - Cache-first for Next.js immutable static assets
//   - Pre-cache app shell routes at install time
//   - Stale-while-revalidate for page navigation (non-auth, non-API)
//   - Network-only for API calls and auth routes

// Bump CACHE_VERSION on each deploy to purge stale navigation cache
const CACHE_VERSION = '2026-03-12'
const CACHE = `senda-${CACHE_VERSION}`

const SHELL_URLS = [
  '/',
  '/dashboard',
  '/study',
  '/study/configure',
  '/verbs',
  '/progress',
  '/curriculum',
  '/offline',
  '/manifest.webmanifest',
  '/icon',
  '/apple-icon',
]

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Add shell URLs individually — a single failure won't block the install
      Promise.allSettled(
        SHELL_URLS.map((url) =>
          cache.add(url).catch(() => { /* ignore — shell pre-cache is best-effort */ })
        )
      )
    )
  )
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

  const url = new URL(request.url)

  // ── 1. Cache-first for Next.js immutable static assets ────────────────────
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, clone))
            }
            return res
          })
      )
    )
    return
  }

  // ── 2. Network-only for API calls, auth routes, and cross-origin ───────────
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return
  }

  // ── 3. Stale-while-revalidate for page navigation ─────────────────────────
  // Serve cached shell immediately; revalidate in background.
  // Auth-gated data comes from fresh Supabase API calls, so stale HTML is safe.
  // Falls back to /offline page when both cache and network are unavailable.
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone())
              return res
            })
            .catch(() =>
              caches.match('/offline').then((offlinePage) => offlinePage ?? Response.error())
            )
          return cached ?? networkFetch
        })
      )
    )
    return
  }

  // ── 4. Cache-first for icons and manifest (static meta assets) ────────────
  if (
    url.pathname === '/icon' ||
    url.pathname === '/apple-icon' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, clone))
            }
            return res
          })
      )
    )
  }
})

// Push notification received
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    // Malformed payload — show a generic notification rather than silently failing
  }
  const title = data.title ?? 'Senda'
  const options = {
    body: data.body ?? 'You have reviews due today.',
    icon: '/icon',
    badge: '/icon',
    data: { url: data.url ?? '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification clicked — open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
