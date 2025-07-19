import React, { useState, useEffect } from 'react';
import { 
  TrashIcon, 
  ArrowPathIcon, 
  ChartBarIcon,
  ClockIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getCacheStats, clearCache, invalidateCache, tradesAPI } from '../utils/api';

const CacheManager = ({ userId }) => {
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadCacheStats();
    
    // Auto-refresh cache stats every 30 seconds
    const interval = setInterval(loadCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
      setLastUpdated(new Date());
      console.log('[CacheManager] Cache stats loaded:', stats);
    } catch (error) {
      console.error('[CacheManager] Error loading cache stats:', error);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear all cache? This will remove all cached API responses.')) {
      return;
    }

    setLoading(true);
    try {
      await clearCache();
      await loadCacheStats();
      console.log('[CacheManager] Cache cleared successfully');
    } catch (error) {
      console.error('[CacheManager] Error clearing cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateTrades = async () => {
    setLoading(true);
    try {
      await tradesAPI.clearTradesCache();
      await loadCacheStats();
      console.log('[CacheManager] Trades cache invalidated');
    } catch (error) {
      console.error('[CacheManager] Error invalidating trades cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTrades = async () => {
    if (!userId) {
      alert('User ID is required to refresh trades cache');
      return;
    }

    setLoading(true);
    try {
      await tradesAPI.refreshTradesCache(userId);
      await loadCacheStats();
      console.log('[CacheManager] Trades cache refreshed');
    } catch (error) {
      console.error('[CacheManager] Error refreshing trades cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCacheAge = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const now = Date.now();
    const age = now - timestamp.getTime();
    const minutes = Math.floor(age / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  const getCacheHealthStatus = () => {
    if (!cacheStats) return { status: 'unknown', message: 'Loading...' };
    
    const { memorySize, dbSize, totalSize } = cacheStats;
    
    if (totalSize === 0) {
      return { status: 'empty', message: 'Cache is empty' };
    }
    
    if (totalSize > 1000) {
      return { status: 'warning', message: 'Cache is getting large' };
    }
    
    if (memorySize > 0 && dbSize > 0) {
      return { status: 'healthy', message: 'Cache is working optimally' };
    }
    
    return { status: 'ok', message: 'Cache is operational' };
  };

  const healthStatus = getCacheHealthStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Cache Manager</h3>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and control API response caching
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadCacheStats}
            disabled={loading}
            className="btn-secondary text-sm"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cache Health Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          {healthStatus.status === 'healthy' && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
          {healthStatus.status === 'warning' && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />}
          {healthStatus.status === 'empty' && <ServerIcon className="h-6 w-6 text-gray-400" />}
          {healthStatus.status === 'unknown' && <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />}
          
          <div>
            <div className="font-medium text-gray-900">
              Cache Status: {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </div>
            <div className="text-sm text-gray-600">{healthStatus.message}</div>
          </div>
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-900">Memory Cache</div>
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-2">
              {cacheStats.memorySize}
            </div>
            <div className="text-xs text-blue-700">entries</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-5 w-5 text-green-600" />
              <div className="text-sm font-medium text-green-900">IndexedDB Cache</div>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-2">
              {cacheStats.dbSize}
            </div>
            <div className="text-xs text-green-700">entries</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
              <div className="text-sm font-medium text-purple-900">Total Entries</div>
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-2">
              {cacheStats.totalSize}
            </div>
            <div className="text-xs text-purple-700">cached items</div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-orange-600" />
              <div className="text-sm font-medium text-orange-900">Cache Age</div>
            </div>
            <div className="text-lg font-bold text-orange-900 mt-2">
              {formatCacheAge(cacheStats.oldestEntry)}
            </div>
            <div className="text-xs text-orange-700">oldest entry</div>
          </div>
        </div>
      )}

      {/* Cache Actions */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Cache Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleInvalidateTrades}
              disabled={loading}
              className="btn-secondary justify-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear Trades Cache
            </button>
            
            <button
              onClick={handleRefreshTrades}
              disabled={loading || !userId}
              className="btn-primary justify-center"
              title={!userId ? 'User ID required' : ''}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh Trades
            </button>
            
            <button
              onClick={handleClearCache}
              disabled={loading}
              className="btn-danger justify-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear All Cache
            </button>
          </div>
        </div>

        {/* Cache Entries List */}
        {cacheStats?.entries && cacheStats.entries.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Cache Entries</h4>
            <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {cacheStats.entries.slice(0, 10).map((entry, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {entry.key}
                      </div>
                      <div className="text-xs text-gray-500">
                        Cached {formatCacheAge(entry.timestamp)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {entry.hasETag && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ETag
                        </span>
                      )}
                      {entry.stale && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Stale
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheManager; 