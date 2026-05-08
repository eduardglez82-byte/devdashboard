/* eslint-disable no-restricted-globals */
/**
 * DevDashboard Service Worker
 * - Activación inmediata (sin tener que cerrar todas las pestañas).
 * - Estrategia network-first para navegación; cache-first para assets estáticos.
 * - Sirve un fallback offline básico cuando no hay red.
 */

const VERSION = 'v3';
const STATIC_CACHE = `dd-static-${VERSION}`;
const RUNTIME_CACHE = `dd-runtime-${VERSION}`;

const PRECACHE_URLS = [
    '/',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/apple-touch-icon.png',
    '/icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) =>
            // ignoramos fallos individuales (assets opcionales)
            Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
                    .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Mismo origen únicamente
    if (url.origin !== self.location.origin) return;

    // Nunca cachear API ni Sanctum (datos vivos + cookies)
    if (url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/sanctum') ||
        url.pathname.startsWith('/livewire')) {
        return;
    }

    // Navegación HTML → network-first con fallback al index cacheado
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                    return res;
                })
                .catch(() =>
                    caches.match(req).then((m) => m || caches.match('/'))
                )
        );
        return;
    }

    // Assets (build, icons, fonts) → cache-first
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                }
                return res;
            }).catch(() => cached);
        })
    );
});

// Permite forzar update desde la app (postMessage 'SKIP_WAITING')
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
