/**
 * Push Notification Manager for Trade Journal PWA
 * Handles push subscriptions, notifications, and permissions
 */

import { getDB } from './indexedDB';

class PushNotificationManager {
  constructor() {
    this.subscription = null;
    this.isSupported = this.checkPushSupport();
    this.permission = Notification.permission;
    this.listeners = new Set();
    
    this.init();
  }

  checkPushSupport() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async init() {
    if (!this.isSupported) {
      console.warn('[PushNotifications] Push notifications not supported');
      return;
    }

    try {
      // Get existing subscription
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('[PushNotifications] Existing subscription found');
        await this.saveSubscription(this.subscription);
      }
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
      
      console.log('[PushNotifications] Initialized');
    } catch (error) {
      console.error('[PushNotifications] Initialization failed:', error);
    }
  }

  handleSWMessage(event) {
    const { data } = event;
    
    if (data && data.type === 'NOTIFICATION_CLICKED') {
      console.log('[PushNotifications] Notification clicked:', data);
      this.notifyListeners('notification_clicked', data);
    }
  }

  // Add listener for push events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback({ type, data, timestamp: Date.now() });
      } catch (error) {
        console.error('[PushNotifications] Listener error:', error);
      }
    });
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      console.log('[PushNotifications] Permission result:', permission);
      this.notifyListeners('permission_changed', { permission });
      
      return permission === 'granted';
    } catch (error) {
      console.error('[PushNotifications] Permission request failed:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe(vapidPublicKey) {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Push notification permission denied');
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      this.subscription = subscription;
      console.log('[PushNotifications] Subscribed successfully');
      
      // Save subscription to backend and local storage
      await this.saveSubscription(subscription);
      
      this.notifyListeners('subscribed', { subscription });
      return subscription;
    } catch (error) {
      console.error('[PushNotifications] Subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      console.log('[PushNotifications] No active subscription to unsubscribe');
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        await this.removeSubscription();
        this.subscription = null;
        console.log('[PushNotifications] Unsubscribed successfully');
        this.notifyListeners('unsubscribed');
      }
      
      return success;
    } catch (error) {
      console.error('[PushNotifications] Unsubscribe failed:', error);
      throw error;
    }
  }

  // Save subscription to backend and local storage
  async saveSubscription(subscription) {
    try {
      // Save to local storage
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));
      
      // Save to IndexedDB
      const db = await getDB();
      await db.setSetting('pushSubscription', subscription);
      
      // Send to backend
      await this.sendSubscriptionToBackend(subscription);
      
      console.log('[PushNotifications] Subscription saved');
    } catch (error) {
      console.error('[PushNotifications] Failed to save subscription:', error);
    }
  }

  // Remove subscription from backend and local storage
  async removeSubscription() {
    try {
      // Remove from local storage
      localStorage.removeItem('pushSubscription');
      
      // Remove from IndexedDB
      const db = await getDB();
      await db.setSetting('pushSubscription', null);
      
      // Notify backend
      if (this.subscription) {
        await this.removeSubscriptionFromBackend(this.subscription);
      }
      
      console.log('[PushNotifications] Subscription removed');
    } catch (error) {
      console.error('[PushNotifications] Failed to remove subscription:', error);
    }
  }

  // Send subscription to backend
  async sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Backend subscription failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[PushNotifications] Backend subscription successful:', result);
    } catch (error) {
      console.error('[PushNotifications] Backend subscription failed:', error);
      // Don't throw - subscription can still work locally
    }
  }

  // Remove subscription from backend
  async removeSubscriptionFromBackend(subscription) {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ subscription })
      });

      if (!response.ok) {
        throw new Error(`Backend unsubscribe failed: ${response.statusText}`);
      }

      console.log('[PushNotifications] Backend unsubscribe successful');
    } catch (error) {
      console.error('[PushNotifications] Backend unsubscribe failed:', error);
    }
  }

  // Show local notification
  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('[PushNotifications] Cannot show notification - no permission');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const notificationOptions = {
        body: options.body || '',
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/icon-192x192.png',
        image: options.image,
        vibrate: options.vibrate || [100, 50, 100],
        data: options.data || {},
        actions: options.actions || [],
        requireInteraction: options.requireInteraction || false,
        tag: options.tag || 'trade-journal-notification',
        renotify: options.renotify || false,
        silent: options.silent || false,
        timestamp: Date.now(),
        ...options
      };

      await registration.showNotification(title, notificationOptions);
      console.log('[PushNotifications] Notification shown:', title);
      
      this.notifyListeners('notification_shown', { title, options: notificationOptions });
    } catch (error) {
      console.error('[PushNotifications] Failed to show notification:', error);
    }
  }

  // Get subscription status
  getStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isSubscribed: !!this.subscription,
      subscription: this.subscription
    };
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get auth token (implement based on your auth system)
  getAuthToken() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token || '';
  }

  // Predefined notification templates
  async showTradeNotification(type, tradeData) {
    const templates = {
      trade_executed: {
        title: 'Trade Executed',
        body: `${tradeData.instrument} trade executed - ${tradeData.result}`,
        icon: '/icon-192x192.png',
        actions: [
          { action: 'view', title: 'View Trade' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: { tradeId: tradeData.id, type: 'trade_executed' }
      },
      sync_completed: {
        title: 'Sync Complete',
        body: 'Your trades have been synchronized',
        icon: '/icon-192x192.png',
        tag: 'sync-notification'
      },
      daily_summary: {
        title: 'Daily Summary',
        body: `Today: ${tradeData.trades} trades, ${tradeData.pnl >= 0 ? '+' : ''}$${tradeData.pnl}`,
        icon: '/icon-192x192.png',
        actions: [
          { action: 'view_analytics', title: 'View Analytics' }
        ]
      }
    };

    const template = templates[type];
    if (template) {
      await this.showNotification(template.title, template);
    }
  }

  // Test notification
  async testNotification() {
    await this.showNotification('Test Notification', {
      body: 'This is a test notification from Trade Journal',
      actions: [
        { action: 'test', title: 'Test Action' }
      ],
      data: { test: true }
    });
  }
}

// Singleton instance
let pushManagerInstance = null;

export const getPushManager = () => {
  if (!pushManagerInstance) {
    pushManagerInstance = new PushNotificationManager();
  }
  return pushManagerInstance;
};

// Convenience functions
export const requestNotificationPermission = async () => {
  const manager = getPushManager();
  return manager.requestPermission();
};

export const subscribeToPush = async (vapidKey) => {
  const manager = getPushManager();
  return manager.subscribe(vapidKey);
};

export const unsubscribeFromPush = async () => {
  const manager = getPushManager();
  return manager.unsubscribe();
};

export const showNotification = async (title, options) => {
  const manager = getPushManager();
  return manager.showNotification(title, options);
};

export const showTradeNotification = async (type, tradeData) => {
  const manager = getPushManager();
  return manager.showTradeNotification(type, tradeData);
};

export const getPushStatus = () => {
  const manager = getPushManager();
  return manager.getStatus();
};

export const addPushListener = (callback) => {
  const manager = getPushManager();
  return manager.addListener(callback);
};

// React hook factory for push notifications
export const createUsePushNotifications = (React) => () => {
  const [status, setStatus] = React.useState(() => getPushStatus());

  React.useEffect(() => {
    const manager = getPushManager();
    
    const updateStatus = () => {
      setStatus(manager.getStatus());
    };

    // Listen for status changes
    const unsubscribe = manager.addListener((event) => {
      if (['permission_changed', 'subscribed', 'unsubscribed'].includes(event.type)) {
        updateStatus();
      }
    });

    // Check for permission changes
    const checkPermission = () => {
      if (manager.permission !== Notification.permission) {
        manager.permission = Notification.permission;
        updateStatus();
      }
    };

    const interval = setInterval(checkPermission, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return status;
};

// Export the class
export default PushNotificationManager; 