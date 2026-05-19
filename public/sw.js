// Minimal Service Worker for Fanbe CRM PWA install eligibility.
// Doing the bare minimum that Chrome + PWABuilder need to recognize the
// site as "installable":
//   - register
//   - fetch handler (network-first; falls back to cache for offline shell)
//
// Intentionally NOT aggressive about caching because the CRM is data-heavy
// (live lead changes, realtime subscriptions, attendance GPS punches) —
// stale cached responses would cause real bugs. Cache only the static
// app shell (HTML / static assets), not API responses.

const CACHE_NAME = 'fanbe-crm-shell-v1';
const APP_SHELL = ['/', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Only handle GET; skip Supabase / Vercel / API calls explicitly so they
  // always hit network and don't get served stale data.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.host !== self.location.host) return;
  if (url.pathname.startsWith('/api')) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        // Cache static assets that came back OK
        if (res.ok && (url.pathname === '/' || url.pathname.startsWith('/assets/'))) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/')))
  );
});
