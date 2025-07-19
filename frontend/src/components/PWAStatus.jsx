import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  SignalIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { addSyncListener, getSyncStatus, triggerManualSync } from '../utils/backgroundSync';
import { getPushStatus, addPushListener } from '../utils/pushNotifications';

const PWAStatus = ({ userId }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    syncInProgress: false,
    pendingOperations: 0,
    lastSyncAttempt: null
  });
  const [pushStatus, setPushStatus] = useState({
    isSupported: false,
    permission: 'default',
    isSubscribed: false
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial statuses
    updateSyncStatus();
    updatePushStatus();

    // Sync status listener
    const unsubscribeSync = addSyncListener((event) => {
      console.log('[PWAStatus] Sync event:', event.type);
      updateSyncStatus();
    });

    // Push status listener
    const unsubscribePush = addPushListener((event) => {
      console.log('[PWAStatus] Push event:', event.type);
      updatePushStatus();
    });

    // Update status periodically
    const interval = setInterval(() => {
      updateSyncStatus();
      updatePushStatus();
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
      unsubscribePush();
      clearInterval(interval);
    };
  }, []);

  const updateSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('[PWAStatus] Error getting sync status:', error);
    }
  };

  const updatePushStatus = () => {
    try {
      const status = getPushStatus();
      setPushStatus(status);
    } catch (error) {
      console.error('[PWAStatus] Error getting push status:', error);
    }
  };

  const handleManualSync = async () => {
    if (isManualSyncing || syncStatus.syncInProgress) return;
    
    setIsManualSyncing(true);
    try {
      await triggerManualSync();
      console.log('[PWAStatus] Manual sync triggered');
    } catch (error) {
      console.error('[PWAStatus] Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (syncStatus.syncInProgress) return 'text-yellow-500';
    if (syncStatus.pendingOperations > 0) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <SignalSlashIcon className={`h-4 w-4 ${getStatusColor()}`} />;
    }
    if (syncStatus.syncInProgress || isManualSyncing) {
      return <CloudArrowUpIcon className={`h-4 w-4 ${getStatusColor()} animate-pulse`} />;
    }
    if (syncStatus.pendingOperations > 0) {
      return <ClockIcon className={`h-4 w-4 ${getStatusColor()}`} />;
    }
    return <CheckCircleIcon className={`h-4 w-4 ${getStatusColor()}`} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.syncInProgress || isManualSyncing) return 'Syncing...';
    if (syncStatus.pendingOperations > 0) return `${syncStatus.pendingOperations} pending`;
    return 'Synced';
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Main status indicator */}
      <div 
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>

      {/* Manual sync button */}
      {isOnline && syncStatus.pendingOperations > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isManualSyncing || syncStatus.syncInProgress}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Manual sync"
        >
          <CloudArrowUpIcon className={`h-4 w-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Detailed status modal/dropdown */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">PWA Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Connection Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {isOnline ? (
                    <WifiIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <SignalSlashIcon className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">Network</div>
                    <div className="text-sm text-gray-600">
                      {isOnline ? 'Connected' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>

              {/* Sync Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {syncStatus.syncInProgress ? (
                    <CloudArrowUpIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
                  ) : syncStatus.pendingOperations > 0 ? (
                    <ClockIcon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <div className="font-medium">Synchronization</div>
                    <div className="text-sm text-gray-600">
                      {syncStatus.syncInProgress 
                        ? 'Syncing in progress...' 
                        : syncStatus.pendingOperations > 0 
                        ? `${syncStatus.pendingOperations} items pending`
                        : 'All data synchronized'
                      }
                    </div>
                  </div>
                </div>
                {syncStatus.pendingOperations > 0 && isOnline && (
                  <button
                    onClick={handleManualSync}
                    disabled={isManualSyncing || syncStatus.syncInProgress}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                  >
                    Sync Now
                  </button>
                )}
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {pushStatus.isSubscribed ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : pushStatus.isSupported ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <SignalSlashIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-gray-600">
                      {!pushStatus.isSupported 
                        ? 'Not supported' 
                        : pushStatus.isSubscribed 
                        ? 'Enabled'
                        : pushStatus.permission === 'denied' 
                        ? 'Blocked'
                        : 'Not enabled'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Sync Info */}
              {syncStatus.lastSyncAttempt && (
                <div className="text-xs text-gray-500 text-center">
                  Last sync: {new Date(syncStatus.lastSyncAttempt).toLocaleString()}
                </div>
              )}

              {/* PWA Features */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Features</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    <span>Offline Storage</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    <span>Background Sync</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {pushStatus.isSupported ? (
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <SignalSlashIcon className="h-3 w-3 text-gray-400" />
                    )}
                    <span>Push Notifications</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3 text-green-500" />
                    <span>App Install</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAStatus; 