import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PWAUpdate = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newWorker, setNewWorker] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      checkForUpdates();
      
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWAUpdate] New service worker activated');
        window.location.reload();
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      
      // Check for updates periodically (every 10 minutes)
      const interval = setInterval(checkForUpdates, 10 * 60 * 1000);
      
      return () => {
        clearInterval(interval);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);

  const handleSWMessage = (event) => {
    const { data } = event;
    
    if (data && data.type === 'SW_ACTIVATED') {
      console.log('[PWAUpdate] Service worker activated:', data.version);
      setUpdateAvailable(true);
      setShowUpdatePrompt(true);
    }
  };

  const checkForUpdates = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // Check for updates
      await registration.update();
      
      // Check if there's a worker waiting
      if (registration.waiting) {
        console.log('[PWAUpdate] Service worker update available');
        setNewWorker(registration.waiting);
        setUpdateAvailable(true);
        setShowUpdatePrompt(true);
      }
      
      // Listen for new workers
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWAUpdate] New service worker installed');
            setNewWorker(newWorker);
            setUpdateAvailable(true);
            setShowUpdatePrompt(true);
          }
        });
      });
    } catch (error) {
      console.error('[PWAUpdate] Error checking for updates:', error);
    }
  };

  const handleUpdate = async () => {
    if (!newWorker) return;
    
    setIsUpdating(true);
    
    try {
      // Tell the service worker to skip waiting and activate immediately
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // The controllerchange event will reload the page
      console.log('[PWAUpdate] Activating new service worker...');
    } catch (error) {
      console.error('[PWAUpdate] Error updating service worker:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    // Remember user dismissed the update for this session
    sessionStorage.setItem('pwa-update-dismissed', Date.now().toString());
  };

  const handleRefresh = () => {
    setIsUpdating(true);
    window.location.reload();
  };

  // Don't show if user recently dismissed
  const dismissedTime = sessionStorage.getItem('pwa-update-dismissed');
  const recentlyDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime)) < 30 * 60 * 1000; // 30 minutes

  if (!updateAvailable || !showUpdatePrompt || recentlyDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <ArrowPathIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900">
                Update Available
              </h3>
              <p className="text-sm text-gray-500">
                A new version of Trade Journal is ready
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-500"
            disabled={isUpdating}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Update
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            disabled={isUpdating}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Later
          </button>
        </div>
        
        {/* Update progress indicator */}
        {isUpdating && (
          <div className="mt-3">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <span className="text-xs text-gray-500">Updating...</span>
            </div>
          </div>
        )}
        
        {/* Feature highlights for update */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">What's new:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Improved offline synchronization</li>
              <li>Enhanced performance and caching</li>
              <li>Bug fixes and stability improvements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdate; 