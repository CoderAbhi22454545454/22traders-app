const CACHE_NAME = 'trade-journal-v2';
const DATA_CACHE_NAME = 'trade-journal-data-v2';
const RUNTIME_CACHE_NAME = 'trade-journal-runtime-v2';

// Static assets to cache immediately
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png'
];

// API endpoints that should be cached for offline access
const API_ENDPOINTS = [
  '/api/trades',
  '/api/auth/me'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Stale while revalidate for frequently updated content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Opened cache:', CACHE_NAME);
        await cache.addAll(urlsToCache);
        console.log('[SW] Cached static assets');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[SW] Cache addAll failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2');
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        // Take control of all clients immediately
        await clients.claim();
        console.log('[SW] Service Worker activated and claimed clients');
        
        // Notify clients about the update
        const clientList = await clients.matchAll();
        clientList.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: 'v2'
          });
        });
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticAssets(request));
});

// Network-first strategy for API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response (clone for caching)
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', url.pathname);
    
    // If network fails, try cache
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add a header to indicate this is from cache
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'service-worker-cache');
      return response;
    }
    
    // If no cache, return error response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No network connection and no cached data available',
        cached: false
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try cache first for app shell
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, try network
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    const cache = await caches.open(CACHE_NAME);
    return cache.match('/offline.html');
  }
}

// Stale-while-revalidate for static assets
async function handleStaticAssets(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore fetch errors for background updates
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  return fetchPromise || fetch(request);
}

// Background sync for offline trade submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-trades') {
    event.waitUntil(syncPendingTrades());
  }
  
  if (event.tag === 'sync-trade-updates') {
    event.waitUntil(syncTradeUpdates());
  }
});

// Sync pending trades when online
async function syncPendingTrades() {
  try {
    console.log('[SW] Syncing pending trades...');
    
    // Get pending trades from IndexedDB
    const pendingTrades = await getPendingTrades();
    console.log('[SW] Found', pendingTrades.length, 'pending trades');
    
    for (const trade of pendingTrades) {
      try {
        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trade.data)
        });
        
        if (response.ok) {
          // Remove from pending trades
          await removePendingTrade(trade.id);
          console.log('[SW] Successfully synced trade:', trade.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync trade:', trade.id, error);
      }
    }
    
    // Notify clients about sync completion
    const clientList = await clients.matchAll();
    clientList.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncType: 'trades'
      });
    });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync trade updates
async function syncTradeUpdates() {
  try {
    console.log('[SW] Syncing trade updates...');
    
    const pendingUpdates = await getPendingUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/trades/${update.tradeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removePendingUpdate(update.id);
          console.log('[SW] Successfully synced update:', update.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync update:', update.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Trade updates sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Default message',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ],
    requireInteraction: true,
    tag: 'trade-journal-notification'
  };
  
  let notificationData = options;
  
  try {
    if (event.data) {
      const data = event.data.json();
      notificationData = {
        ...options,
        body: data.body || options.body,
        title: data.title || 'Trade Journal',
        data: { ...options.data, ...data.data }
      };
    }
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
  }
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Trade Journal',
      notificationData
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action: event.action,
              data: event.notification.data
            });
            return client.focus();
          }
        }
        
        // If no client is open, open new window
        if (clients.openWindow) {
          const targetUrl = event.notification.data?.url || '/';
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: 'v2' });
    return;
  }
  
  if (event.data && event.data.type === 'CACHE_TRADE') {
    event.waitUntil(cacheTrade(event.data.trade));
    return;
  }
});

// Cache individual trade data
async function cacheTrade(tradeData) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = new Response(JSON.stringify(tradeData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/api/trades/${tradeData.id}`, response);
    console.log('[SW] Cached trade:', tradeData.id);
  } catch (error) {
    console.error('[SW] Failed to cache trade:', error);
  }
}

// IndexedDB helper functions
async function getPendingTrades() {
  return new Promise((resolve) => {
    // This would integrate with IndexedDB
    // For now, return empty array
    resolve([]);
  });
}

async function removePendingTrade(id) {
  return new Promise((resolve) => {
    // This would remove from IndexedDB
    resolve();
  });
}

async function getPendingUpdates() {
  return new Promise((resolve) => {
    resolve([]);
  });
}

async function removePendingUpdate(id) {
  return new Promise((resolve) => {
    resolve();
  });
}

// Periodic background tasks
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-trades-periodic') {
    event.waitUntil(syncPendingTrades());
  }
});

console.log('[SW] Service Worker v2 loaded successfully'); 