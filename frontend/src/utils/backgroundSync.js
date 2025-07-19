/**
 * Background Sync Manager for Trade Journal PWA
 * Handles offline data synchronization and coordination with service worker
 */

import { getDB, syncPendingData } from './indexedDB';

class BackgroundSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.syncQueue = [];
    this.listeners = new Set();
    this.retryTimeout = null;
    
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
    }
    
    // Start periodic sync check
    this.startPeriodicSync();
    
    console.log('[BackgroundSync] Initialized');
  }

  handleOnline() {
    console.log('[BackgroundSync] Network online detected');
    this.isOnline = true;
    this.notifyListeners('online');
    this.triggerSync();
  }

  handleOffline() {
    console.log('[BackgroundSync] Network offline detected');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  handleSWMessage(event) {
    const { data } = event;
    
    if (data && data.type === 'SYNC_COMPLETE') {
      console.log('[BackgroundSync] Service worker sync complete:', data.syncType);
      this.notifyListeners('sync_complete', data);
    }
    
    if (data && data.type === 'SW_ACTIVATED') {
      console.log('[BackgroundSync] Service worker activated:', data.version);
      this.notifyListeners('sw_updated', data);
    }
  }

  // Add listener for sync events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ type, data, timestamp: Date.now() });
      } catch (error) {
        console.error('[BackgroundSync] Listener error:', error);
      }
    });
  }

  // Queue operations for background sync
  async queueOperation(operation, data, priority = 'MEDIUM') {
    try {
      const db = await getDB();
      await db.addToPendingSync(operation, data, priority);
      
      console.log('[BackgroundSync] Queued operation:', operation, data);
      
      // If online, trigger immediate sync
      if (this.isOnline) {
        this.triggerSync();
      } else {
        // Register background sync with service worker
        this.registerBackgroundSync('sync-trades');
      }
      
      this.notifyListeners('operation_queued', { operation, data });
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Failed to queue operation:', error);
      return false;
    }
  }

  // Trigger manual sync
  async triggerSync() {
    if (this.syncInProgress || !this.isOnline) {
      console.log('[BackgroundSync] Sync skipped - in progress or offline');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners('sync_started');

    try {
      console.log('[BackgroundSync] Starting sync...');
      
      // Use IndexedDB sync function
      await syncPendingData();
      
      // Also trigger service worker sync if available
      this.registerBackgroundSync('sync-trades');
      
      this.notifyListeners('sync_success');
      console.log('[BackgroundSync] Sync completed successfully');
      
    } catch (error) {
      console.error('[BackgroundSync] Sync failed:', error);
      this.notifyListeners('sync_error', error);
      this.scheduleRetry();
    } finally {
      this.syncInProgress = false;
    }
  }

  // Register background sync with service worker
  registerBackgroundSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register(tag);
      }).then(() => {
        console.log('[BackgroundSync] Background sync registered:', tag);
      }).catch(error => {
        console.error('[BackgroundSync] Background sync registration failed:', error);
      });
    }
  }

  // Schedule retry on sync failure
  scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    // Exponential backoff: start with 30 seconds, max 5 minutes
    const retryDelay = Math.min(30000 * Math.pow(2, this.getRetryCount()), 300000);
    
    this.retryTimeout = setTimeout(() => {
      if (this.isOnline) {
        console.log('[BackgroundSync] Retrying sync after delay');
        this.triggerSync();
      }
    }, retryDelay);
  }

  getRetryCount() {
    // Simple retry count - could be enhanced with persistent storage
    return parseInt(sessionStorage.getItem('bgSyncRetryCount') || '0', 10);
  }

  incrementRetryCount() {
    const current = this.getRetryCount();
    sessionStorage.setItem('bgSyncRetryCount', (current + 1).toString());
  }

  resetRetryCount() {
    sessionStorage.removeItem('bgSyncRetryCount');
  }

  // Periodic sync check
  startPeriodicSync() {
    setInterval(async () => {
      if (this.isOnline && !this.syncInProgress) {
        const db = await getDB();
        const pendingItems = await db.getPendingSync();
        
        if (pendingItems.length > 0) {
          console.log(`[BackgroundSync] Periodic check found ${pendingItems.length} pending items`);
          this.triggerSync();
        }
      }
    }, 60000); // Check every minute
  }

  // Trade-specific sync operations
  async syncTrade(trade) {
    return this.queueOperation('CREATE_TRADE', trade, 'HIGH');
  }

  async syncTradeUpdate(tradeId, updates) {
    return this.queueOperation('UPDATE_TRADE', { id: tradeId, updates }, 'HIGH');
  }

  async syncTradeDelete(tradeId) {
    return this.queueOperation('DELETE_TRADE', { id: tradeId }, 'MEDIUM');
  }

  // Bulk sync operations
  async syncBulkTrades(trades) {
    const promises = trades.map(trade => this.syncTrade(trade));
    return Promise.all(promises);
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const db = await getDB();
      const pendingItems = await db.getPendingSync();
      
      return {
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        pendingOperations: pendingItems.length,
        pendingItems: pendingItems,
        lastSyncAttempt: this.getLastSyncAttempt(),
        retryCount: this.getRetryCount()
      };
    } catch (error) {
      console.error('[BackgroundSync] Error getting sync status:', error);
      return {
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        pendingOperations: 0,
        pendingItems: [],
        error: error.message
      };
    }
  }

  getLastSyncAttempt() {
    const timestamp = localStorage.getItem('lastSyncAttempt');
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }

  setLastSyncAttempt() {
    localStorage.setItem('lastSyncAttempt', Date.now().toString());
  }

  // Clear all pending sync operations
  async clearPendingSync() {
    try {
      const db = await getDB();
      await db.clear('pendingSync');
      this.notifyListeners('pending_cleared');
      console.log('[BackgroundSync] Cleared all pending sync operations');
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Error clearing pending sync:', error);
      return false;
    }
  }

  // Force sync regardless of online status (for testing)
  async forceSyncTest() {
    if (this.syncInProgress) {
      console.log('[BackgroundSync] Force sync skipped - already in progress');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners('sync_started');

    try {
      console.log('[BackgroundSync] Force sync started...');
      await syncPendingData();
      this.notifyListeners('sync_success');
      this.resetRetryCount();
    } catch (error) {
      console.error('[BackgroundSync] Force sync failed:', error);
      this.notifyListeners('sync_error', error);
      this.incrementRetryCount();
    } finally {
      this.syncInProgress = false;
      this.setLastSyncAttempt();
    }
  }

  // Destroy the sync manager
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    this.listeners.clear();
    console.log('[BackgroundSync] Destroyed');
  }
}

// Singleton instance
let syncManagerInstance = null;

export const getSyncManager = () => {
  if (!syncManagerInstance) {
    syncManagerInstance = new BackgroundSyncManager();
  }
  return syncManagerInstance;
};

// Convenience functions
export const syncTrade = async (trade) => {
  const manager = getSyncManager();
  return manager.syncTrade(trade);
};

export const syncTradeUpdate = async (tradeId, updates) => {
  const manager = getSyncManager();
  return manager.syncTradeUpdate(tradeId, updates);
};

export const syncTradeDelete = async (tradeId) => {
  const manager = getSyncManager();
  return manager.syncTradeDelete(tradeId);
};

export const triggerManualSync = async () => {
  const manager = getSyncManager();
  return manager.triggerSync();
};

export const getSyncStatus = async () => {
  const manager = getSyncManager();
  return manager.getSyncStatus();
};

export const addSyncListener = (callback) => {
  const manager = getSyncManager();
  return manager.addListener(callback);
};

// React hook for sync status (import React in components that use this)
export const createUseSyncStatus = (React) => () => {
  const [status, setStatus] = React.useState({
    isOnline: navigator.onLine,
    syncInProgress: false,
    pendingOperations: 0,
    pendingItems: []
  });

  React.useEffect(() => {
    const manager = getSyncManager();
    
    // Get initial status
    manager.getSyncStatus().then(setStatus);
    
    // Listen for updates
    const unsubscribe = manager.addListener((event) => {
      // Update status on sync events
      if (['online', 'offline', 'sync_started', 'sync_success', 'sync_error', 'operation_queued'].includes(event.type)) {
        manager.getSyncStatus().then(setStatus);
      }
    });

    return unsubscribe;
  }, []);

  return status;
};

// Export the class for direct usage
export default BackgroundSyncManager;

// Offline-first trade operations
export const createTradeOffline = async (trade) => {
  try {
    const db = await getDB();
    const syncManager = getSyncManager();
    
    // Save to IndexedDB first
    const savedTrade = await db.saveTrade(trade);
    
    // Queue for sync if online
    if (navigator.onLine) {
      await syncManager.syncTrade(savedTrade);
    }
    
    return savedTrade;
  } catch (error) {
    console.error('[BackgroundSync] Error creating trade offline:', error);
    throw error;
  }
};

export const updateTradeOffline = async (tradeId, updates) => {
  try {
    const db = await getDB();
    const syncManager = getSyncManager();
    
    // Update in IndexedDB first
    const updatedTrade = await db.updateTrade(tradeId, updates);
    
    // Queue for sync if online
    if (navigator.onLine) {
      await syncManager.syncTradeUpdate(tradeId, updates);
    }
    
    return updatedTrade;
  } catch (error) {
    console.error('[BackgroundSync] Error updating trade offline:', error);
    throw error;
  }
};

export const deleteTradeOffline = async (tradeId) => {
  try {
    const db = await getDB();
    const syncManager = getSyncManager();
    
    // Delete from IndexedDB first
    await db.deleteTrade(tradeId);
    
    // Queue for sync if online
    if (navigator.onLine) {
      await syncManager.syncTradeDelete(tradeId);
    }
    
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Error deleting trade offline:', error);
    throw error;
  }
}; 