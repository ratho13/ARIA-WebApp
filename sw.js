// Service Worker für ARIA PWA
const CACHE_NAME = 'aria-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/aria.html'
];

// Install Event - Cache wichtige Dateien
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache-Fehler:', err);
      })
  );
});

// Fetch Event - Serve aus Cache, fallback zu Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Kein Cache - fetch vom Network
        return fetch(event.request).then(
          response => {
            // Check ob valide Response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone die Response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // Offline Fallback
        return caches.match('/');
      })
    );
});

// Activate Event - Cleanup alte Caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background Sync für Offline-Messages (Optional)
self.addEventListener('sync', event => {
  if (event.tag === 'send-message') {
    event.waitUntil(sendQueuedMessages());
  }
});

// Push Notifications (Optional für später)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'ARIA hat eine Nachricht für dich!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('ARIA', options)
  );
});