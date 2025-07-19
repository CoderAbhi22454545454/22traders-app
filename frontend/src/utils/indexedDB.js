/**
 * IndexedDB wrapper for Trade Journal PWA
 * Handles offline data storage, sync queues, and data management
 */

const DB_NAME = 'TradeJournalDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  TRADES: 'trades',
  USER_DATA: 'userData',
  PENDING_SYNC: 'pendingSync',
  CACHE_METADATA: 'cacheMetadata',
  SETTINGS: 'settings',
  API_CACHE: 'apiCache'
};

class IndexedDBManager {
  constructor() {
    this.db = null;
    this.isSupported = this.checkIndexedDBSupport();
  }

  checkIndexedDBSupport() {
    return typeof indexedDB !== 'undefined';
  }

  async init() {
    if (!this.isSupported) {
      throw new Error('IndexedDB is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB connection failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB connected successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        this.createStores(db);
      };
    });
  }

  createStores(db) {
    // Trades store
    if (!db.objectStoreNames.contains(STORES.TRADES)) {
      const tradesStore = db.createObjectStore(STORES.TRADES, { keyPath: 'id' });
      tradesStore.createIndex('userId', 'userId', { unique: false });
      tradesStore.createIndex('date', 'date', { unique: false });
      tradesStore.createIndex('instrument', 'instrument', { unique: false });
      tradesStore.createIndex('lastModified', 'lastModified', { unique: false });
      console.log('Created trades store');
    }

    // User data store
    if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
      const userStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      userStore.createIndex('email', 'email', { unique: true });
      console.log('Created user data store');
    }

    // Pending sync store for offline operations
    if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
      const syncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('priority', 'priority', { unique: false });
      console.log('Created pending sync store');
    }

    // Cache metadata store
    if (!db.objectStoreNames.contains(STORES.CACHE_METADATA)) {
      const metadataStore = db.createObjectStore(STORES.CACHE_METADATA, { keyPath: 'key' });
      console.log('Created cache metadata store');
    }

    // Settings store
    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
      const settingsStore = db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      console.log('Created settings store');
    }

    // API Cache store
    if (!db.objectStoreNames.contains(STORES.API_CACHE)) {
      const apiCacheStore = db.createObjectStore(STORES.API_CACHE, { keyPath: 'key' });
      apiCacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      apiCacheStore.createIndex('stale', 'stale', { unique: false });
      console.log('Created API cache store');
    }
  }

  // Generic CRUD operations
  async add(storeName, data) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...data,
        lastModified: Date.now(),
        synced: false
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...data,
        lastModified: Date.now()
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, query = null) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const source = indexName ? store.index(indexName) : store;
    
    return new Promise((resolve, reject) => {
      const request = query ? source.getAll(query) : source.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Trade-specific operations
  async saveTrade(trade) {
    try {
      // Add to trades store
      await this.put(STORES.TRADES, trade);
      
      // If offline, add to pending sync
      if (!navigator.onLine) {
        await this.addToPendingSync('CREATE_TRADE', trade, 'HIGH');
      }
      
      console.log('Trade saved successfully:', trade.id);
      return trade;
    } catch (error) {
      console.error('Error saving trade:', error);
      throw error;
    }
  }

  async updateTrade(tradeId, updates) {
    try {
      const existingTrade = await this.get(STORES.TRADES, tradeId);
      if (!existingTrade) {
        throw new Error('Trade not found');
      }

      const updatedTrade = { ...existingTrade, ...updates };
      await this.put(STORES.TRADES, updatedTrade);

      // If offline, add to pending sync
      if (!navigator.onLine) {
        await this.addToPendingSync('UPDATE_TRADE', { id: tradeId, updates }, 'HIGH');
      }

      console.log('Trade updated successfully:', tradeId);
      return updatedTrade;
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }

  async getTrade(tradeId) {
    return this.get(STORES.TRADES, tradeId);
  }

  async getTrades(userId, filters = {}) {
    try {
      let trades = await this.getAll(STORES.TRADES, 'userId', userId);

      // Apply filters
      if (filters.startDate) {
        trades = trades.filter(trade => new Date(trade.date) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        trades = trades.filter(trade => new Date(trade.date) <= new Date(filters.endDate));
      }
      if (filters.instrument) {
        trades = trades.filter(trade => 
          trade.instrument === filters.instrument || 
          trade.tradePair === filters.instrument
        );
      }
      if (filters.result) {
        trades = trades.filter(trade => 
          (trade.result || trade.tradeOutcome) === filters.result
        );
      }

      // Sort by date (newest first)
      trades.sort((a, b) => new Date(b.date) - new Date(a.date));

      return trades;
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  }

  async deleteTrade(tradeId) {
    try {
      await this.delete(STORES.TRADES, tradeId);

      // If offline, add to pending sync
      if (!navigator.onLine) {
        await this.addToPendingSync('DELETE_TRADE', { id: tradeId }, 'MEDIUM');
      }

      console.log('Trade deleted successfully:', tradeId);
      return true;
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  }

  // User data operations
  async saveUserData(userData) {
    return this.put(STORES.USER_DATA, userData);
  }

  async getUserData(userId) {
    return this.get(STORES.USER_DATA, userId);
  }

  // Sync queue operations
  async addToPendingSync(operation, data, priority = 'MEDIUM') {
    const syncItem = {
      type: operation,
      data: data,
      timestamp: Date.now(),
      priority: priority,
      retryCount: 0,
      maxRetries: 3
    };

    return this.add(STORES.PENDING_SYNC, syncItem);
  }

  async getPendingSync() {
    try {
      const pending = await this.getAll(STORES.PENDING_SYNC);
      // Sort by priority and timestamp
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      
      return pending.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.timestamp - b.timestamp;
      });
    } catch (error) {
      console.error('Error fetching pending sync items:', error);
      return [];
    }
  }

  async removePendingSync(syncId) {
    return this.delete(STORES.PENDING_SYNC, syncId);
  }

  async incrementSyncRetry(syncId) {
    try {
      const item = await this.get(STORES.PENDING_SYNC, syncId);
      if (item) {
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastAttempt = Date.now();
        
        if (item.retryCount >= item.maxRetries) {
          // Move to failed state or remove
          console.warn('Sync item exceeded max retries:', syncId);
          await this.removePendingSync(syncId);
          return false;
        }
        
        await this.put(STORES.PENDING_SYNC, item);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error incrementing sync retry:', error);
      return false;
    }
  }

  // Cache metadata operations
  async setCacheMetadata(key, metadata) {
    return this.put(STORES.CACHE_METADATA, { key, ...metadata, timestamp: Date.now() });
  }

  async getCacheMetadata(key) {
    return this.get(STORES.CACHE_METADATA, key);
  }

  // Settings operations
  async setSetting(key, value) {
    return this.put(STORES.SETTINGS, { key, value, timestamp: Date.now() });
  }

  async getSetting(key, defaultValue = null) {
    try {
      const setting = await this.get(STORES.SETTINGS, key);
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  // Bulk operations
  async bulkSaveTrades(trades) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    
    const transaction = this.db.transaction([STORES.TRADES], 'readwrite');
    const store = transaction.objectStore(STORES.TRADES);
    
    const promises = trades.map(trade => {
      return new Promise((resolve, reject) => {
        const request = store.put({
          ...trade,
          lastModified: Date.now(),
          synced: true
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });

    return Promise.all(promises);
  }

  // Database maintenance
  async getStorageUsage() {
    if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate();
    }
    return null;
  }

  async cleanup() {
    if (!this.db) {
      console.warn('Database not initialized. Skipping cleanup.');
      return;
    }
    
    try {
      // Remove old cache metadata (older than 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const transaction = this.db.transaction([STORES.CACHE_METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_METADATA);
      const cursor = await store.openCursor();
      
      const deletePromises = [];
      while (cursor) {
        if (cursor.value.timestamp < weekAgo) {
          deletePromises.push(cursor.delete());
        }
        cursor = await cursor.continue();
      }
      
      await Promise.all(deletePromises);
      console.log('IndexedDB cleanup completed');
    } catch (error) {
      console.error('Error during IndexedDB cleanup:', error);
    }
  }

  // Connection management
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('IndexedDB connection closed');
    }
  }
}

// Singleton instance
let dbInstance = null;

export const getDB = async () => {
  if (!dbInstance) {
    dbInstance = new IndexedDBManager();
    await dbInstance.init();
  }
  return dbInstance;
};

export const isIndexedDBSupported = () => {
  return typeof indexedDB !== 'undefined';
};

// Export the class for direct usage if needed
export default IndexedDBManager;

// Convenience functions
export const saveTradeOffline = async (trade) => {
  const db = await getDB();
  return db.saveTrade(trade);
};

export const getTradesOffline = async (userId, filters) => {
  const db = await getDB();
  return db.getTrades(userId, filters);
};

export const syncPendingData = async () => {
  const db = await getDB();
  const pendingItems = await db.getPendingSync();
  
  console.log('Found', pendingItems.length, 'items to sync');
  
  for (const item of pendingItems) {
    try {
      let success = false;
      
      switch (item.type) {
        case 'CREATE_TRADE':
          success = await syncCreateTrade(item.data);
          break;
        case 'UPDATE_TRADE':
          success = await syncUpdateTrade(item.data);
          break;
        case 'DELETE_TRADE':
          success = await syncDeleteTrade(item.data);
          break;
      }
      
      if (success) {
        await db.removePendingSync(item.id);
      } else {
        await db.incrementSyncRetry(item.id);
      }
    } catch (error) {
      console.error('Error syncing item:', item.id, error);
      await db.incrementSyncRetry(item.id);
    }
  }
};

// Helper sync functions (to be implemented based on your API)
const syncCreateTrade = async (tradeData) => {
  try {
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const syncUpdateTrade = async ({ id, updates }) => {
  try {
    const response = await fetch(`/api/trades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

const syncDeleteTrade = async ({ id }) => {
  try {
    const response = await fetch(`/api/trades/${id}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}; 