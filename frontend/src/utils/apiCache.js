/**
 * API Cache Manager for Trade Journal
 * Provides intelligent caching with expiration, ETags, and invalidation strategies
 */

import { getDB } from './indexedDB';

class APICacheManager {
  constructor() {
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.memoryCache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Generate cache key from URL and params
   */
  generateCacheKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${paramString ? `?${paramString}` : ''}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cachedItem, ttl = this.defaultTTL) {
    if (!cachedItem || !cachedItem.timestamp) {
      return false;
    }
    
    const now = Date.now();
    const age = now - cachedItem.timestamp;
    return age < ttl;
  }

  /**
   * Get cached data from memory first, then IndexedDB
   */
  async getCachedData(cacheKey, ttl = this.defaultTTL) {
    try {
      // Check memory cache first (fastest)
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem && this.isCacheValid(memoryItem, ttl)) {
        console.log(`[APICache] Memory cache hit for: ${cacheKey}`);
        return {
          data: memoryItem.data,
          source: 'memory',
          timestamp: memoryItem.timestamp,
          etag: memoryItem.etag
        };
      }

      // Check IndexedDB cache
      const db = await getDB();
      const cachedItem = await db.getCacheMetadata(cacheKey);
      
      if (cachedItem && this.isCacheValid(cachedItem, ttl)) {
        console.log(`[APICache] IndexedDB cache hit for: ${cacheKey}`);
        
        // Update memory cache
        this.memoryCache.set(cacheKey, cachedItem);
        
        return {
          data: cachedItem.data,
          source: 'indexeddb',
          timestamp: cachedItem.timestamp,
          etag: cachedItem.etag
        };
      }

      return null;
    } catch (error) {
      console.error('[APICache] Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Store data in both memory and IndexedDB
   */
  async setCachedData(cacheKey, data, etag = null, ttl = this.defaultTTL) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        etag,
        ttl,
        url: cacheKey
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, cacheItem);

      // Store in IndexedDB
      const db = await getDB();
      await db.setCacheMetadata(cacheKey, cacheItem);

      console.log(`[APICache] Data cached for: ${cacheKey}`);
    } catch (error) {
      console.error('[APICache] Error caching data:', error);
    }
  }

  /**
   * Make cached API request with network fallback
   */
  async cachedFetch(url, options = {}, cacheOptions = {}) {
    const {
      ttl = this.defaultTTL,
      forceRefresh = false,
      useETag = true,
      staleWhileRevalidate = false
    } = cacheOptions;

    const cacheKey = this.generateCacheKey(url, options.params);
    
    // Check for pending request to avoid duplicate calls
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`[APICache] Waiting for pending request: ${cacheKey}`);
      return this.pendingRequests.get(cacheKey);
    }

    // If not forcing refresh, try cache first
    if (!forceRefresh) {
      const cachedResult = await this.getCachedData(cacheKey, ttl);
      
      if (cachedResult) {
        // If stale-while-revalidate, update in background
        if (staleWhileRevalidate && !this.isCacheValid(cachedResult, ttl / 2)) {
          console.log(`[APICache] Serving stale data and revalidating: ${cacheKey}`);
          this.revalidateInBackground(url, options, cacheOptions, cacheKey);
        }
        
        return {
          ...cachedResult.data,
          _cached: true,
          _source: cachedResult.source,
          _timestamp: cachedResult.timestamp
        };
      }
    }

    // Make network request
    const requestPromise = this.makeNetworkRequest(url, options, cacheKey, useETag);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Make network request with ETag support
   */
  async makeNetworkRequest(url, options, cacheKey, useETag = true) {
    try {
      console.log(`[APICache] Making network request: ${cacheKey}`);
      
      // Prepare request options
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      // Add ETag header if available
      if (useETag) {
        const cachedResult = await this.getCachedData(cacheKey, Infinity);
        if (cachedResult?.etag) {
          requestOptions.headers['If-None-Match'] = cachedResult.etag;
        }
      }

      // Add request body if present
      if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
      }

      // Add query parameters to URL
      let requestUrl = url;
      if (options.params) {
        const queryString = new URLSearchParams(options.params).toString();
        requestUrl += (url.includes('?') ? '&' : '?') + queryString;
      }

      const response = await fetch(requestUrl, requestOptions);

      // Handle 304 Not Modified
      if (response.status === 304) {
        console.log(`[APICache] Data not modified (304): ${cacheKey}`);
        const cachedResult = await this.getCachedData(cacheKey, Infinity);
        if (cachedResult) {
          // Update timestamp but keep existing data
          await this.setCachedData(cacheKey, cachedResult.data, cachedResult.etag);
          return {
            ...cachedResult.data,
            _cached: true,
            _source: 'not-modified',
            _timestamp: cachedResult.timestamp
          };
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const etag = response.headers.get('ETag');

      // Cache the response
      await this.setCachedData(cacheKey, data, etag);

      console.log(`[APICache] Fresh data received: ${cacheKey}`);
      return {
        ...data,
        _cached: false,
        _source: 'network',
        _timestamp: Date.now()
      };

    } catch (error) {
      console.error(`[APICache] Network request failed: ${cacheKey}`, error);
      
      // Try to return stale cache as fallback
      const staleCache = await this.getCachedData(cacheKey, Infinity);
      if (staleCache) {
        console.log(`[APICache] Returning stale cache as fallback: ${cacheKey}`);
        return {
          ...staleCache.data,
          _cached: true,
          _source: 'stale-fallback',
          _timestamp: staleCache.timestamp,
          _error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Revalidate cache in background (for stale-while-revalidate)
   */
  async revalidateInBackground(url, options, cacheOptions, cacheKey) {
    try {
      setTimeout(async () => {
        console.log(`[APICache] Background revalidation: ${cacheKey}`);
        await this.makeNetworkRequest(url, options, cacheKey, cacheOptions.useETag);
      }, 0);
    } catch (error) {
      console.error('[APICache] Background revalidation failed:', error);
    }
  }

  /**
   * Invalidate cache for specific key or pattern
   */
  async invalidateCache(pattern) {
    try {
      console.log(`[APICache] Invalidating cache pattern: ${pattern}`);
      
      // Clear from memory cache
      if (typeof pattern === 'string') {
        this.memoryCache.delete(pattern);
      } else {
        // Pattern matching for memory cache
        for (const key of this.memoryCache.keys()) {
          if (pattern.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }

      // Clear from IndexedDB
      const db = await getDB();
      if (typeof pattern === 'string') {
        await db.delete('cacheMetadata', pattern);
      } else {
        // Pattern matching would require getting all keys and filtering
        // For now, we'll implement specific patterns
        if (pattern.toString().includes('trades')) {
          // Clear all trade-related cache
          await db.clear('cacheMetadata');
        }
      }
    } catch (error) {
      console.error('[APICache] Error invalidating cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache() {
    try {
      console.log('[APICache] Clearing all cache');
      
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear IndexedDB cache
      const db = await getDB();
      await db.clear('cacheMetadata');
    } catch (error) {
      console.error('[APICache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const memorySize = this.memoryCache.size;
      const db = await getDB();
      const indexedDBItems = await db.getAll('cacheMetadata');
      
      const stats = {
        memoryCache: {
          size: memorySize,
          keys: Array.from(this.memoryCache.keys())
        },
        indexedDBCache: {
          size: indexedDBItems.length,
          totalSize: JSON.stringify(indexedDBItems).length,
          keys: indexedDBItems.map(item => item.key)
        },
        pendingRequests: this.pendingRequests.size
      };
      
      return stats;
    } catch (error) {
      console.error('[APICache] Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Preload data into cache
   */
  async preloadCache(url, options = {}, cacheOptions = {}) {
    try {
      console.log(`[APICache] Preloading cache: ${url}`);
      await this.cachedFetch(url, options, { ...cacheOptions, forceRefresh: true });
    } catch (error) {
      console.error('[APICache] Error preloading cache:', error);
    }
  }
}

// Singleton instance
let cacheManagerInstance = null;

export const getCacheManager = () => {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new APICacheManager();
  }
  return cacheManagerInstance;
};

// Convenience functions
export const cachedFetch = async (url, options, cacheOptions) => {
  const manager = getCacheManager();
  return manager.cachedFetch(url, options, cacheOptions);
};

export const invalidateCache = async (pattern) => {
  const manager = getCacheManager();
  return manager.invalidateCache(pattern);
};

export const clearAllCache = async () => {
  const manager = getCacheManager();
  return manager.clearAllCache();
};

export const getCacheStats = async () => {
  const manager = getCacheManager();
  return manager.getCacheStats();
};

// Export the class for direct usage
export default APICacheManager; 