// FinTrack service worker.
//
// Deliberately conservative for a finance app:
//  - Supabase / cross-origin requests are NEVER intercepted or cached
//    (financial data must stay fresh and must not be persisted to disk).
//  - Authenticated page HTML is NEVER stored — navigations are network-first
//    and fall back only to a generic, data-free offline page.
//  - Only the immutable app shell (Next static assets, icons) is cached.
const CACHE = 'fintrack-v1'
const PRECACHE = ['/offline', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Same-origin only. Supabase and any other cross-origin traffic passes
  // straight through to the network, untouched and uncached.
  if (url.origin !== self.location.origin) return

  // Never touch auth or API routes — always live network.
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) return

  // Navigations: network-first, generic offline page as the only fallback.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
    return
  }

  // Immutable static assets: cache-first, then populate cache.
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/fonts') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
            return res
          })
      )
    )
    return
  }

  // Everything else same-origin: network only, no caching.
})
