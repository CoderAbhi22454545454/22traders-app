import React, { useState, useEffect } from 'react';
import { 
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getCacheStats } from '../utils/apiCache';

const CacheStatus = ({ className = "" }) => {
  const [cacheStats, setCacheStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCacheStats();
    
    // Refresh cache stats every minute
    const interval = setInterval(loadCacheStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('[CacheStatus] Error loading cache stats:', error);
    }
  };

  const getCacheStatusInfo = () => {
    if (!cacheStats) return { icon: ClockIcon, color: 'text-gray-400', text: 'Loading...' };
    
    const { memorySize, dbSize, totalSize } = cacheStats;
    
    if (totalSize === 0) {
      return { icon: ServerIcon, color: 'text-gray-400', text: 'No cache' };
    }
    
    if (memorySize > 0) {
      return { icon: CheckCircleIcon, color: 'text-green-500', text: `${totalSize} cached` };
    }
    
    if (dbSize > 0) {
      return { icon: ExclamationTriangleIcon, color: 'text-yellow-500', text: `${dbSize} stored` };
    }
    
    return { icon: ServerIcon, color: 'text-blue-500', text: 'Cache ready' };
  };

  const statusInfo = getCacheStatusInfo();
  const IconComponent = statusInfo.icon;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center space-x-1 px-2 py-1 rounded text-xs hover:bg-gray-100"
        title="Cache Status"
      >
        <IconComponent className={`h-3 w-3 ${statusInfo.color}`} />
        <span className="text-gray-600">{statusInfo.text}</span>
      </button>

      {/* Details Tooltip */}
      {showDetails && cacheStats && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-50">
          <div className="space-y-2">
            <div className="font-medium text-gray-900 text-sm">Cache Status</div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Memory:</span>
                <span className="ml-1 font-medium">{cacheStats.memorySize}</span>
              </div>
              <div>
                <span className="text-gray-500">Storage:</span>
                <span className="ml-1 font-medium">{cacheStats.dbSize}</span>
              </div>
            </div>
            
            {cacheStats.oldestEntry && (
              <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                Oldest: {Math.floor((Date.now() - cacheStats.oldestEntry.getTime()) / (1000 * 60))}m ago
              </div>
            )}
          </div>
          
          {/* Close overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CacheStatus; 