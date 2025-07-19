const express = require('express');
const router = express.Router();

// For production, you would use web-push library
// npm install web-push
// const webpush = require('web-push');

// In-memory storage for subscriptions (use database in production)
const subscriptions = new Map();

// VAPID keys (generate your own in production)
// webpush.setVapidDetails(
//   'mailto:your-email@domain.com',
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// Store push subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userAgent, userId } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required' });
    }

    // Extract user ID from request (implement your auth logic)
    const user = req.user || { id: userId || 'anonymous' };
    
    // Store subscription in memory (use database in production)
    const subscriptionData = {
      id: generateSubscriptionId(),
      subscription,
      userAgent,
      userId: user.id,
      createdAt: new Date(),
      isActive: true
    };
    
    subscriptions.set(subscriptionData.id, subscriptionData);
    
    console.log('[Push] New subscription saved:', subscriptionData.id);
    
    res.status(201).json({
      message: 'Subscription saved successfully',
      subscriptionId: subscriptionData.id
    });
    
    // Send welcome notification
    setTimeout(() => {
      sendNotification(subscriptionData.id, {
        title: 'Trade Journal',
        body: 'Push notifications enabled! You\'ll receive updates about your trades.',
        icon: '/icon-192x192.png',
        tag: 'welcome'
      });
    }, 2000);
    
  } catch (error) {
    console.error('[Push] Subscription error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Remove push subscription
router.post('/unsubscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required' });
    }

    // Find and remove subscription
    let removedCount = 0;
    for (const [id, sub] of subscriptions.entries()) {
      if (sub.subscription.endpoint === subscription.endpoint) {
        subscriptions.delete(id);
        removedCount++;
        console.log('[Push] Subscription removed:', id);
      }
    }
    
    res.json({
      message: 'Subscription removed successfully',
      removedCount
    });
    
  } catch (error) {
    console.error('[Push] Unsubscription error:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

// Send notification to specific user
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, options = {} } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ error: 'UserId and title are required' });
    }

    // Find user subscriptions
    const userSubscriptions = Array.from(subscriptions.values())
      .filter(sub => sub.userId === userId && sub.isActive);
    
    if (userSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscriptions found for user' });
    }

    // Send notification to all user's subscriptions
    const results = await Promise.allSettled(
      userSubscriptions.map(sub => 
        sendNotification(sub.id, { title, body, ...options })
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({
      message: 'Notifications sent',
      successful,
      failed,
      total: userSubscriptions.length
    });
    
  } catch (error) {
    console.error('[Push] Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Broadcast notification to all users
router.post('/broadcast', async (req, res) => {
  try {
    const { title, body, options = {} } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Get all active subscriptions
    const activeSubscriptions = Array.from(subscriptions.values())
      .filter(sub => sub.isActive);
    
    if (activeSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscriptions found' });
    }

    // Send to all subscriptions
    const results = await Promise.allSettled(
      activeSubscriptions.map(sub => 
        sendNotification(sub.id, { title, body, ...options })
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({
      message: 'Broadcast sent',
      successful,
      failed,
      total: activeSubscriptions.length
    });
    
  } catch (error) {
    console.error('[Push] Broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Get subscription statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalSubscriptions: subscriptions.size,
      activeSubscriptions: Array.from(subscriptions.values()).filter(s => s.isActive).length,
      uniqueUsers: new Set(Array.from(subscriptions.values()).map(s => s.userId)).size,
      createdToday: Array.from(subscriptions.values()).filter(s => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return s.createdAt >= today;
      }).length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('[Push] Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  // In production, return your actual VAPID public key
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BK7nQZgqpOOuWFtDwKdrRvIXKhW9MkokGb9vXxuqj7D7rGPj4Y8vXm5qXRhYXdKg2dKJMxDkOsXqCLCqLgQ8KhY';
  
  res.json({ publicKey });
});

// Send trade-related notifications
router.post('/trade-notification', async (req, res) => {
  try {
    const { userId, type, tradeData } = req.body;
    
    if (!userId || !type || !tradeData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const notifications = {
      'trade_executed': {
        title: 'Trade Executed',
        body: `${tradeData.instrument} trade executed - ${tradeData.result}`,
        icon: '/icon-192x192.png',
        actions: [
          { action: 'view', title: 'View Trade' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: { tradeId: tradeData.id, type: 'trade_executed' }
      },
      'daily_summary': {
        title: 'Daily Summary',
        body: `Today: ${tradeData.trades} trades, ${tradeData.pnl >= 0 ? '+' : ''}$${tradeData.pnl}`,
        icon: '/icon-192x192.png',
        actions: [
          { action: 'view_analytics', title: 'View Analytics' }
        ],
        data: { type: 'daily_summary' }
      },
      'weekly_report': {
        title: 'Weekly Report Ready',
        body: `Your weekly trading report is ready. Win rate: ${tradeData.winRate}%`,
        icon: '/icon-192x192.png',
        actions: [
          { action: 'view_report', title: 'View Report' }
        ],
        data: { type: 'weekly_report' }
      }
    };

    const notificationData = notifications[type];
    if (!notificationData) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    // Find user subscriptions
    const userSubscriptions = Array.from(subscriptions.values())
      .filter(sub => sub.userId === userId && sub.isActive);
    
    if (userSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscriptions found for user' });
    }

    // Send notification
    const results = await Promise.allSettled(
      userSubscriptions.map(sub => 
        sendNotification(sub.id, notificationData)
      )
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    res.json({
      message: 'Trade notification sent',
      successful,
      total: userSubscriptions.length
    });
    
  } catch (error) {
    console.error('[Push] Trade notification error:', error);
    res.status(500).json({ error: 'Failed to send trade notification' });
  }
});

// Test endpoint for development
router.post('/test', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId || !subscriptions.has(subscriptionId)) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const result = await sendNotification(subscriptionId, {
      title: 'Test Notification',
      body: 'This is a test notification from Trade Journal API',
      icon: '/icon-192x192.png',
      actions: [
        { action: 'test', title: 'Test Action' }
      ],
      data: { test: true }
    });
    
    res.json({ message: 'Test notification sent', result });
    
  } catch (error) {
    console.error('[Push] Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Helper function to send notification
async function sendNotification(subscriptionId, notificationData) {
  try {
    const subscriptionData = subscriptions.get(subscriptionId);
    if (!subscriptionData || !subscriptionData.isActive) {
      throw new Error('Subscription not found or inactive');
    }

    // In production, use web-push library:
    /*
    const payload = JSON.stringify(notificationData);
    const result = await webpush.sendNotification(
      subscriptionData.subscription,
      payload
    );
    console.log('[Push] Notification sent successfully:', result);
    return result;
    */
    
    // For development, just log the notification
    console.log('[Push] Notification would be sent to:', subscriptionData.userId);
    console.log('[Push] Notification data:', notificationData);
    
    return { success: true, subscriptionId, notificationData };
    
  } catch (error) {
    console.error('[Push] Send notification error:', error);
    
    // If subscription is invalid, mark as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      const subscriptionData = subscriptions.get(subscriptionId);
      if (subscriptionData) {
        subscriptionData.isActive = false;
        console.log('[Push] Subscription marked as inactive:', subscriptionId);
      }
    }
    
    throw error;
  }
}

// Helper function to generate subscription ID
function generateSubscriptionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = router; 