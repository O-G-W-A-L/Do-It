import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/notifications.js';

/**
 * Custom hook for notification management
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeConnection, setRealTimeConnection] = useState(null);

  // Fetch notifications
  const getNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await notificationsService.getNotifications(params);
      if (result.success) {
        setNotifications(result.data.results || result.data);
        // Calculate unread count
        const unread = (result.data.results || result.data).filter(n => !n.is_read).length;
        setUnreadCount(unread);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationsService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
      return null;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationsService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
        setUnreadCount(0);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
      return null;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationsService.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
      return false;
    }
  }, []);

  // Notification preferences
  const getNotificationPreferences = useCallback(async () => {
    try {
      const result = await notificationsService.getNotificationPreferences();
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notification preferences');
      return null;
    }
  }, []);

  const updateNotificationPreferences = useCallback(async (preferences) => {
    try {
      const result = await notificationsService.updateNotificationPreferences(preferences);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to update notification preferences');
      return null;
    }
  }, []);

  // Real-time notifications
  const subscribeToRealTimeNotifications = useCallback((callback) => {
    const handleNotification = (notification) => {
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Call user callback
      if (callback) {
        callback(notification);
      }
    };

    notificationsService.subscribeToNotifications(handleNotification)
      .then(result => {
        if (result.success) {
          setRealTimeConnection(result.eventSource);
        }
      })
      .catch(err => {
        setError('Failed to subscribe to real-time notifications');
      });
  }, []);

  const unsubscribeFromRealTimeNotifications = useCallback(() => {
    if (realTimeConnection) {
      notificationsService.unsubscribeFromNotifications(realTimeConnection);
      setRealTimeConnection(null);
    }
  }, [realTimeConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realTimeConnection) {
        notificationsService.unsubscribeFromNotifications(realTimeConnection);
      }
    };
  }, [realTimeConnection]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    realTimeConnection,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationPreferences,
    updateNotificationPreferences,
    subscribeToRealTimeNotifications,
    unsubscribeFromRealTimeNotifications,
    // Utility functions
    clearError: () => setError(null),
    setNotifications: setNotifications
  };
}
