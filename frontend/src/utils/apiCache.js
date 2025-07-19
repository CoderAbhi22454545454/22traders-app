/**
 * API Cache Manager for Trade Journal
 * Implements intelligent caching with ETag support and cache invalidation
 */

import { getDB } from './indexedDB';

class APICacheManager {
  constructor() {
    this.cache = new Map(); // In-memory cache for current session
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.cacheName = 'api-cache';
  }

  /**
   * Generate cache key from URL and parameters
   */
  getCacheKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}?${new URLSearchParams(sortedParams).toString()}`;
  }

  /**
   * Check if cache entry is valid
   */
  isCacheValid(cacheEntry, ttl = this.defaultTTL) {
    if (!cacheEntry) return false;
    
    const now = Date.now();
    const cacheAge = now - cacheEntry.timestamp;
    
    // Check TTL
    if (cacheAge > ttl) return false;
    
    // Check if marked as stale
    if (cacheEntry.stale) return false;
    
    return true;
  }

  /**
   * Get cached response from IndexedDB
   */
  async getCachedResponse(cacheKey, ttl = this.defaultTTL) {
    try {
      // Check in-memory cache first
      const memoryCache = this.cache.get(cacheKey);
      if (memoryCache && this.isCacheValid(memoryCache, ttl)) {
        console.log('[APICache] Memory cache hit:', cacheKey);
        return {
          data: memoryCache.data,
          fromCache: true,
          cacheType: 'memory'
        };
      }

      // Check IndexedDB cache
      const db = await getDB();
      const cachedEntry = await db.get('apiCache', cacheKey);
      
      if (cachedEntry && this.isCacheValid(cachedEntry, ttl)) {
        console.log('[APICache] IndexedDB cache hit:', cacheKey);
        
        // Store in memory cache for faster access
        this.cache.set(cacheKey, cachedEntry);
        
        return {
          data: cachedEntry.data,
          fromCache: true,
          cacheType: 'indexeddb',
          etag: cachedEntry.etag,
          lastModified: cachedEntry.lastModified
        };
      }

      return null;
    } catch (error) {
      console.error('[APICache] Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async setCachedResponse(cacheKey, data, headers = {}) {
    try {
      const cacheEntry = {
        key: cacheKey,
        data,
        timestamp: Date.now(),
        etag: headers.etag || headers.ETag,
        lastModified: headers['last-modified'] || headers['Last-Modified'],
        contentLength: headers['content-length'],
        stale: false
      };

      // Store in memory cache
      this.cache.set(cacheKey, cacheEntry);

      // Store in IndexedDB
      const db = await getDB();
      await db.put('apiCache', cacheEntry);

      console.log('[APICache] Response cached:', cacheKey);
    } catch (error) {
      console.error('[APICache] Error caching response:', error);
    }
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidateCache(pattern) {
    try {
      console.log('[APICache] Invalidating cache pattern:', pattern);

      // Clear memory cache
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }

      // Clear IndexedDB cache
      const db = await getDB();
      const allEntries = await db.getAll('apiCache');
      
      const invalidationPromises = allEntries
        .filter(entry => entry.key.includes(pattern))
        .map(entry => db.delete('apiCache', entry.key));
      
      await Promise.all(invalidationPromises);
      
      console.log('[APICache] Cache invalidated for pattern:', pattern);
    } catch (error) {
      console.error('[APICache] Error invalidating cache:', error);
    }
  }

  /**
   * Mark cache entries as stale (for background revalidation)
   */
  async markAsStale(pattern) {
    try {
      console.log('[APICache] Marking cache as stale:', pattern);

      // Mark memory cache as stale
      for (const [key, entry] of this.cache.entries()) {
        if (key.includes(pattern)) {
          entry.stale = true;
        }
      }

      // Mark IndexedDB cache as stale
      const db = await getDB();
      const allEntries = await db.getAll('apiCache');
      
      const stalePromises = allEntries
        .filter(entry => entry.key.includes(pattern))
        .map(async (entry) => {
          entry.stale = true;
          return db.put('apiCache', entry);
        });
      
      await Promise.all(stalePromises);
    } catch (error) {
      console.error('[APICache] Error marking cache as stale:', error);
    }
  }

  /**
   * Make conditional request using ETag/Last-Modified
   */
  async makeConditionalRequest(url, options = {}, cachedEntry = null) {
    const headers = { ...options.headers };

    // Add conditional headers if we have cached data
    if (cachedEntry) {
      if (cachedEntry.etag) {
        headers['If-None-Match'] = cachedEntry.etag;
      }
      if (cachedEntry.lastModified) {
        headers['If-Modified-Since'] = cachedEntry.lastModified;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  }

  /**
   * Cached fetch with smart revalidation
   */
  async cachedFetch(url, options = {}, cacheOptions = {}) {
    const {
      ttl = this.defaultTTL,
      forceRefresh = false,
      useConditional = true,
      cacheKeyParams = {}
    } = cacheOptions;

    const cacheKey = this.getCacheKey(url, cacheKeyParams);

    try {
      // Skip cache if force refresh
      if (!forceRefresh) {
        const cachedResponse = await this.getCachedResponse(cacheKey, ttl);
        if (cachedResponse) {
          // Background revalidation for stale-while-revalidate
          this.revalidateInBackground(url, options, cacheKey, cachedResponse, { useConditional });
          
          return cachedResponse;
        }
      }

      // No valid cache, make network request
      console.log('[APICache] Cache miss, making network request:', cacheKey);
      
      const cachedEntry = await this.getCachedResponse(cacheKey, Infinity); // Get any cached version for conditional request
      
      let response;
      if (useConditional && cachedEntry) {
        response = await this.makeConditionalRequest(url, options, cachedEntry);
        
        // 304 Not Modified - use cached version
        if (response.status === 304) {
          console.log('[APICache] 304 Not Modified, using cached data:', cacheKey);
          
          // Refresh cache timestamp
          await this.setCachedResponse(cacheKey, cachedEntry.data, cachedEntry);
          
          return {
            data: cachedEntry.data,
            fromCache: true,
            cacheType: 'conditional'
          };
        }
      } else {
        response = await fetch(url, options);
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      await this.setCachedResponse(cacheKey, data, responseHeaders);

      return {
        data,
        fromCache: false,
        cacheType: 'network'
      };

    } catch (error) {
      console.error('[APICache] Network request failed:', error);
      
      // Try to return stale cache as fallback
      const staleCache = await this.getCachedResponse(cacheKey, Infinity);
      if (staleCache) {
        console.log('[APICache] Returning stale cache as fallback:', cacheKey);
        return {
          data: staleCache.data,
          fromCache: true,
          cacheType: 'stale',
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Background revalidation for stale-while-revalidate strategy
   */
  async revalidateInBackground(url, options, cacheKey, cachedResponse, revalidateOptions = {}) {
    try {
      // Don't revalidate if already fresh
      if (cachedResponse.cacheType === 'memory') return;
      
      console.log('[APICache] Background revalidation started:', cacheKey);
      
      setTimeout(async () => {
        try {
          const result = await this.cachedFetch(url, options, { 
            forceRefresh: true,
            ...revalidateOptions 
          });
          
          if (!result.fromCache) {
            console.log('[APICache] Background revalidation completed:', cacheKey);
            
            // Notify components about updated data
            this.notifyDataUpdate(cacheKey, result.data);
          }
        } catch (error) {
          console.error('[APICache] Background revalidation failed:', error);
        }
      }, 100); // Small delay to not block main request
    } catch (error) {
      console.error('[APICache] Background revalidation error:', error);
    }
  }

  /**
   * Notify components about data updates
   */
  notifyDataUpdate(cacheKey, newData) {
    const event = new CustomEvent('apiCacheUpdate', {
      detail: { cacheKey, data: newData }
    });
    window.dispatchEvent(event);
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      // Clear memory cache
      this.cache.clear();
      
      // Clear IndexedDB cache
      const db = await getDB();
      await db.clear('apiCache');
      
      console.log('[APICache] All cache cleared');
    } catch (error) {
      console.error('[APICache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const memorySize = this.cache.size;
      
      const db = await getDB();
      const dbEntries = await db.getAll('apiCache');
      const dbSize = dbEntries.length;
      
      const totalSize = memorySize + dbSize;
      const oldestEntry = dbEntries.reduce((oldest, entry) => 
        !oldest || entry.timestamp < oldest.timestamp ? entry : oldest, null);
      const newestEntry = dbEntries.reduce((newest, entry) => 
        !newest || entry.timestamp > newest.timestamp ? entry : newest, null);
      
      return {
        memorySize,
        dbSize,
        totalSize,
        oldestEntry: oldestEntry ? new Date(oldestEntry.timestamp) : null,
        newestEntry: newestEntry ? new Date(newestEntry.timestamp) : null,
        entries: dbEntries.map(entry => ({
          key: entry.key,
          timestamp: new Date(entry.timestamp),
          stale: entry.stale,
          hasETag: !!entry.etag
        }))
      };
    } catch (error) {
      console.error('[APICache] Error getting cache stats:', error);
      return null;
    }
  }
}

// Create global instance
const apiCache = new APICacheManager();

// Export convenience methods
export const cachedFetch = (url, options, cacheOptions) => 
  apiCache.cachedFetch(url, options, cacheOptions);

export const invalidateCache = (pattern) => 
  apiCache.invalidateCache(pattern);

export const clearCache = () => 
  apiCache.clearCache();

export const getCacheStats = () => 
  apiCache.getCacheStats();

export const markAsStale = (pattern) => 
  apiCache.markAsStale(pattern);

// Export the manager class
export default apiCache; 