const CACHE_NAME = 'virtualestate-v1';
const urlsToCache = [
  '/',
  '/properties',
  '/virtual-tours',
  '/offline',
  '/manifest.json'
];

// Install service worker and cache important resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch with cache-first strategy for static assets, network-first for dynamic content
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip Supabase API calls (always fetch fresh)
  if (url.hostname.includes('supabase')) return;

  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return cached version if available
        if (response) {
          // For critical resources, also fetch in background to update cache
          if (request.url.includes('/_next/static/') || 
              request.url.includes('.js') || 
              request.url.includes('.css')) {
            fetch(request).then(fetchResponse => {
              if (fetchResponse.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, fetchResponse);
                });
              }
            }).catch(() => {
              // Silent fail for background updates
            });
          }
          return response;
        }

        // Fetch from network
        return fetch(request).then(fetchResponse => {
          // Don't cache if not a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response
          const responseToCache = fetchResponse.clone();

          // Cache static assets and important pages
          if (request.url.includes('/_next/static/') || 
              request.url.includes('.js') || 
              request.url.includes('.css') ||
              urlsToCache.includes(url.pathname)) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }

          return fetchResponse;
        }).catch(() => {
          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/offline');
          }
          
          // Return cached fallback or empty response
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any queued operations when back online
      console.log('Background sync triggered')
    );
  }
});

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Property',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/close-icon.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('VirtualEstate', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/properties')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});