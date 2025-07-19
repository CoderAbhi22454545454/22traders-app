const express = require('express');
const router = express.Router();

// PWA analytics and metrics
const pwaMetrics = {
  installations: 0,
  dailyActiveUsers: new Set(),
  offlineSessions: 0,
  syncOperations: 0,
  cacheHits: 0,
  cacheMisses: 0
};

// PWA installation tracking
router.post('/install', (req, res) => {
  try {
    const { userId, userAgent, timestamp } = req.body;
    
    pwaMetrics.installations++;
    
    // In production, save to database
    console.log('[PWA] App installed:', { userId, userAgent, timestamp });
    
    res.json({
      message: 'Installation recorded',
      installations: pwaMetrics.installations
    });
  } catch (error) {
    console.error('[PWA] Installation tracking error:', error);
    res.status(500).json({ error: 'Failed to record installation' });
  }
});

// Track daily active users
router.post('/heartbeat', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      pwaMetrics.dailyActiveUsers.add(userId);
    }
    
    res.json({
      message: 'Heartbeat recorded',
      dailyActiveUsers: pwaMetrics.dailyActiveUsers.size
    });
  } catch (error) {
    console.error('[PWA] Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

// Track offline usage
router.post('/offline-session', (req, res) => {
  try {
    const { userId, duration, operations } = req.body;
    
    pwaMetrics.offlineSessions++;
    
    console.log('[PWA] Offline session:', { userId, duration, operations });
    
    res.json({
      message: 'Offline session recorded',
      totalOfflineSessions: pwaMetrics.offlineSessions
    });
  } catch (error) {
    console.error('[PWA] Offline session tracking error:', error);
    res.status(500).json({ error: 'Failed to record offline session' });
  }
});

// Track sync operations
router.post('/sync-operation', (req, res) => {
  try {
    const { userId, operation, status, itemCount } = req.body;
    
    pwaMetrics.syncOperations++;
    
    console.log('[PWA] Sync operation:', { userId, operation, status, itemCount });
    
    res.json({
      message: 'Sync operation recorded',
      totalSyncOperations: pwaMetrics.syncOperations
    });
  } catch (error) {
    console.error('[PWA] Sync operation tracking error:', error);
    res.status(500).json({ error: 'Failed to record sync operation' });
  }
});

// Track cache performance
router.post('/cache-metrics', (req, res) => {
  try {
    const { hits, misses, userId } = req.body;
    
    pwaMetrics.cacheHits += hits || 0;
    pwaMetrics.cacheMisses += misses || 0;
    
    console.log('[PWA] Cache metrics:', { hits, misses, userId });
    
    res.json({
      message: 'Cache metrics recorded',
      totalHits: pwaMetrics.cacheHits,
      totalMisses: pwaMetrics.cacheMisses,
      hitRate: pwaMetrics.cacheHits / (pwaMetrics.cacheHits + pwaMetrics.cacheMisses) * 100
    });
  } catch (error) {
    console.error('[PWA] Cache metrics error:', error);
    res.status(500).json({ error: 'Failed to record cache metrics' });
  }
});

// Get PWA analytics
router.get('/analytics', (req, res) => {
  try {
    const analytics = {
      ...pwaMetrics,
      dailyActiveUsers: pwaMetrics.dailyActiveUsers.size,
      cacheHitRate: pwaMetrics.cacheHits / (pwaMetrics.cacheHits + pwaMetrics.cacheMisses) * 100 || 0,
      timestamp: new Date().toISOString()
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('[PWA] Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Service worker update notification
router.post('/sw-update', (req, res) => {
  try {
    const { version, userId } = req.body;
    
    console.log('[PWA] Service worker update:', { version, userId });
    
    res.json({
      message: 'Service worker update recorded',
      version
    });
  } catch (error) {
    console.error('[PWA] SW update error:', error);
    res.status(500).json({ error: 'Failed to record SW update' });
  }
});

// PWA manifest endpoint with dynamic data
router.get('/manifest', (req, res) => {
  try {
    const manifest = {
      short_name: "Trade Journal",
      name: "Trade Journal - Track Your Trading Performance",
      description: "A comprehensive trading journal app to track and analyze your trading performance",
      icons: [
        {
          src: "icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any"
        },
        {
          src: "apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png"
        }
      ],
      start_url: "/",
      display: "standalone",
      theme_color: "#3B82F6",
      background_color: "#F8FAFC",
      orientation: "portrait-primary",
      scope: "/",
      categories: ["finance", "productivity", "business"],
      lang: "en",
      dir: "ltr"
    };
    
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json(manifest);
  } catch (error) {
    console.error('[PWA] Manifest error:', error);
    res.status(500).json({ error: 'Failed to generate manifest' });
  }
});

// Offline sync endpoint
router.post('/sync', async (req, res) => {
  try {
    const { userId, operations } = req.body;
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations must be an array' });
    }
    
    const results = [];
    
    for (const operation of operations) {
      try {
        let result;
        
        switch (operation.type) {
          case 'CREATE_TRADE':
            // Process trade creation
            result = await processTrade(operation.data);
            break;
          case 'UPDATE_TRADE':
            // Process trade update
            result = await updateTrade(operation.data.id, operation.data.updates);
            break;
          case 'DELETE_TRADE':
            // Process trade deletion
            result = await deleteTrade(operation.data.id);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push({
          operationId: operation.id,
          status: 'success',
          result
        });
      } catch (error) {
        results.push({
          operationId: operation.id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    // Track sync operation
    pwaMetrics.syncOperations++;
    
    res.json({
      message: 'Sync completed',
      successful,
      failed,
      total: operations.length,
      results
    });
    
  } catch (error) {
    console.error('[PWA] Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// PWA capabilities check
router.get('/capabilities', (req, res) => {
  try {
    const capabilities = {
      serviceWorker: true,
      pushNotifications: true,
      backgroundSync: true,
      offlineSupport: true,
      installPrompt: true,
      caching: true,
      indexedDB: true,
      webShare: true,
      fullscreen: true,
      features: [
        'offline_data_storage',
        'background_synchronization',
        'push_notifications',
        'app_installation',
        'service_worker_caching',
        'offline_analytics',
        'trade_synchronization'
      ]
    };
    
    res.json(capabilities);
  } catch (error) {
    console.error('[PWA] Capabilities error:', error);
    res.status(500).json({ error: 'Failed to get capabilities' });
  }
});

// Reset analytics (for testing)
router.post('/reset-analytics', (req, res) => {
  try {
    pwaMetrics.installations = 0;
    pwaMetrics.dailyActiveUsers.clear();
    pwaMetrics.offlineSessions = 0;
    pwaMetrics.syncOperations = 0;
    pwaMetrics.cacheHits = 0;
    pwaMetrics.cacheMisses = 0;
    
    console.log('[PWA] Analytics reset');
    
    res.json({ message: 'Analytics reset successfully' });
  } catch (error) {
    console.error('[PWA] Reset error:', error);
    res.status(500).json({ error: 'Failed to reset analytics' });
  }
});

// Helper functions (implement based on your existing trade routes)
async function processTrade(tradeData) {
  // Implement trade creation logic
  console.log('[PWA] Processing trade creation:', tradeData);
  return { id: Date.now(), ...tradeData, synced: true };
}

async function updateTrade(tradeId, updates) {
  // Implement trade update logic
  console.log('[PWA] Processing trade update:', tradeId, updates);
  return { id: tradeId, ...updates, synced: true };
}

async function deleteTrade(tradeId) {
  // Implement trade deletion logic
  console.log('[PWA] Processing trade deletion:', tradeId);
  return { deleted: true, id: tradeId };
}

// Clean up daily users (reset every 24 hours)
setInterval(() => {
  pwaMetrics.dailyActiveUsers.clear();
  console.log('[PWA] Daily active users reset');
}, 24 * 60 * 60 * 1000);

module.exports = router; 