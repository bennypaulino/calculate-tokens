const CACHE_NAME = 'calculate-tokens-v1';
const PRICES_URL = '/api/v1/prices.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === PRICES_URL) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function verifyHash(body, expectedHash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(body);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHash;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const now = Date.now();

  // Check if cached version is stale enough to warn
  if (cached) {
    const cachedAt = parseInt(cached.headers.get('X-SW-Cached-At') || '0', 10);
    const age = now - cachedAt;
    if (age > STALE_THRESHOLD_MS) {
      notifyClients({ type: 'PRICES_STALE', age });
    }
  }

  // Background revalidation
  const revalidate = fetch(request)
    .then(async (response) => {
      if (!response.ok) return;

      const bodyText = await response.clone().text();

      // Integrity check
      const expectedHash = response.headers.get('X-Content-Hash');
      if (expectedHash) {
        const valid = await verifyHash(bodyText, expectedHash);
        if (!valid) {
          console.error('[SW] prices.json hash mismatch — retaining cached version');
          return;
        }
      }

      // Read old generated_at from cached body (if cached exists)
      let oldGenAt = null;
      if (cached) { try { oldGenAt = JSON.parse(await cached.clone().text()).generated_at; } catch {} }

      // Read new generated_at from bodyText
      let newGenAt = null;
      try { newGenAt = JSON.parse(bodyText).generated_at; } catch {}

      // Store with timestamp header
      const headers = new Headers(response.headers);
      headers.set('X-SW-Cached-At', String(Date.now()));
      const toCache = new Response(bodyText, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      await cache.put(request, toCache);

      const isNew = newGenAt && (!oldGenAt || newGenAt > oldGenAt);
      notifyClients({ type: isNew ? 'PRICES_REFRESH_AVAILABLE' : 'PRICES_UPDATED' });
    })
    .catch(() => {});

  if (cached) {
    // Return cached immediately, update in background
    revalidate; // fire-and-forget
    return cached;
  }

  // No cache — must wait for network
  return revalidate.then(async () => {
    const fresh = await cache.match(request);
    if (fresh) return fresh;
    // Shouldn't happen but fall through to network
    return fetch(request);
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}
