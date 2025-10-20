import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../hooks/useNotifications.js';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    inApp: true,
    courseUpdates: true,
    assignmentDeadlines: true,
    paymentReminders: true
  });

  // Use the notifications hook
  const notificationsHook = useNotifications();

  // Initialize notifications and settings on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load notifications and settings in parallel
        await Promise.all([
          notificationsHook.getNotifications({ limit: 20 }),
          loadNotificationSettings()
        ]);

        // Subscribe to real-time notifications
        notificationsHook.subscribeToRealTimeNotifications(handleNewNotification);
      } catch (error) {
        console.error('Failed to load notification data:', error);
      }
    };

    loadInitialData();

    // Cleanup on unmount
    return () => {
      notificationsHook.unsubscribeFromRealTimeNotifications();
    };
  }, []);

  // Load notification settings
  const loadNotificationSettings = useCallback(async () => {
    try {
      const settings = await notificationsHook.getNotificationPreferences();
      if (settings) {
        setNotificationSettings(prev => ({ ...prev, ...settings }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }, [notificationsHook]);

  // Handle new real-time notifications
  const handleNewNotification = useCallback((notification) => {
    // Show browser notification if permitted
    if (notificationSettings.push && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'Do-It Notification', {
        body: notification.message || notification.content,
        icon: '/icon.png'
      });
    }

    // Could also show toast notification here
    console.log('New notification:', notification);
  }, [notificationSettings.push]);

  // Enhanced notification operations
  const markAsRead = useCallback(async (notificationId) => {
    return await notificationsHook.markAsRead(notificationId);
  }, [notificationsHook]);

  const markAllAsRead = useCallback(async () => {
    return await notificationsHook.markAllAsRead();
  }, [notificationsHook]);

  const deleteNotification = useCallback(async (notificationId) => {
    return await notificationsHook.deleteNotification(notificationId);
  }, [notificationsHook]);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (newSettings) => {
    const result = await notificationsHook.updateNotificationPreferences(newSettings);
    if (result) {
      setNotificationSettings(prev => ({ ...prev, ...newSettings }));
    }
    return result;
  }, [notificationsHook]);

  // Request notification permissions
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationSettings(prev => ({ ...prev, push: true }));
      }
      return permission;
    }
    return 'denied';
  }, []);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notificationsHook.unreadCount;
  }, [notificationsHook.unreadCount]);

  // Filter notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notificationsHook.notifications.filter(notification => notification.type === type);
  }, [notificationsHook.notifications]);

  // Get recent notifications
  const getRecentNotifications = useCallback((limit = 5) => {
    return notificationsHook.notifications.slice(0, limit);
  }, [notificationsHook.notifications]);

  const contextValue = {
    // State
    notifications: notificationsHook.notifications,
    unreadCount: notificationsHook.unreadCount,
    notificationSettings,
    isLoading: notificationsHook.loading,
    error: notificationsHook.error,
    realTimeConnection: notificationsHook.realTimeConnection,

    // Notification operations
    getNotifications: notificationsHook.getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // Settings
    updateNotificationSettings,
    requestNotificationPermission,

    // Utility functions
    getUnreadCount,
    getNotificationsByType,
    getRecentNotifications,
    clearError: notificationsHook.clearError,
    refreshNotifications: () => notificationsHook.getNotifications({ limit: 20 })
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
