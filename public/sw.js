// Service worker for Spanish B1→B2 app
// Strategy:
//   - Cache-first for Next.js immutable static assets
//   - Pre-cache app shell routes at install time
//   - Stale-while-revalidate for page navigation (non-auth, non-API)
//   - Network-only for API calls and auth routes

// Bump CACHE_VERSION on each deploy to purge stale navigation cache
const CACHE_VERSION = '2026-03-24'
const CACHE = `senda-${CACHE_VERSION}`

// Only pre-cache public/static assets — auth-gated pages are cached on first
// successful visit via the network-first navigation handler.
const SHELL_URLS = [
  '/offline',
  '/manifest.webmanifest',
  '/icon',
  '/apple-icon',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.keys().then((existingKeys) => {
      // Auto-activate when upgrading from a different cache version (or first install).
      // This ensures users with an old SW get the new one immediately.
      // For same-version updates, the client controls activation via SKIP_WAITING message.
      const hasCurrentCache = existingKeys.includes(CACHE)
      if (!hasCurrentCache) {
        self.skipWaiting()
      }

      return caches.open(CACHE).then((cache) =>
        // Add shell URLs individually — a single failure won't block the install
        Promise.allSettled(
          SHELL_URLS.map((url) =>
            cache.add(url).catch(() => { /* ignore — shell pre-cache is best-effort */ })
          )
        )
      )
    })
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

  // ── 2. Cache-first for Google Fonts (woff2) ─────────────────────────────
  if (url.hostname === 'fonts.gstatic.com' || (url.hostname === 'fonts.googleapis.com' && url.pathname.endsWith('.woff2'))) {
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

  // ── 3. Network-only for API calls, auth routes, and cross-origin ───────────
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return
  }

  // ── 3b. Stale-while-revalidate for RSC data payloads ────────────────────
  if (url.pathname.startsWith('/_next/data/')) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone())
              return res
            })
            .catch(() => cached ?? Response.error())
          return cached ?? networkFetch
        })
      )
    )
    return
  }

  // ── 3. Network-first for page navigation ───────────────────────────────────
  // Always fetch fresh from server (auth/middleware runs server-side).
  // Fall back to cache only when offline. This prevents stale cached pages
  // from causing redirect errors when auth sessions expire after deploys.
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        fetch(request)
          .then((res) => {
            if (res.ok && !res.redirected) cache.put(request, res.clone())
            // Safari/WebKit rejects SW-served responses with redirected flag.
            // Strip it by creating a clean Response with the same body.
            if (res.redirected) {
              return new Response(res.body, {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
              })
            }
            return res
          })
          .catch(() =>
            cache.match(request).then((cached) =>
              cached ?? caches.match('/offline').then((offlinePage) => offlinePage ?? Response.error())
            )
          )
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

// Background Sync — triggered when connectivity is restored (Chromium only)
// Safari falls back to the 'online' event + useSyncManager hook in the client.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-attempts') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => client.postMessage({ type: 'SYNC_TRIGGERED' }))
      })
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
    body: data.body ?? 'Tienes repasos pendientes hoy.',
    icon: '/icon',
    badge: '/icon',
    data: { url: data.url ?? '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Client-triggered update — called when user taps "Actualizar" in UpdateToast
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
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
