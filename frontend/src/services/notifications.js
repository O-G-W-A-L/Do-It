import api, { apiUtils } from './api.js';

/**
 * Notification service for real-time notifications and messaging
 */
export const notificationsService = {
  // Notification management
  async getNotifications(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/notifications/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getNotification(notificationId) {
    try {
      const response = await api.get(`/api/notifications/${notificationId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await api.post(`/api/notifications/${notificationId}/read/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async markAllAsRead() {
    try {
      const response = await api.post('/api/notifications/mark-all-read/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async deleteNotification(notificationId) {
    try {
      await api.delete(`/api/notifications/${notificationId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async bulkDeleteNotifications(notificationIds) {
    try {
      const response = await api.post('/api/notifications/bulk-delete/', {
        notification_ids: notificationIds
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Notification preferences
  async getNotificationPreferences() {
    try {
      const response = await api.get('/api/notifications/preferences/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async updateNotificationPreferences(preferences) {
    try {
      const response = await api.patch('/api/notifications/preferences/', preferences);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Notification types and templates
  async getNotificationTypes() {
    try {
      const response = await api.get('/api/notifications/types/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Real-time notification subscription
  async subscribeToNotifications(callback) {
    try {
      // WebSocket or Server-Sent Events connection
      const eventSource = new EventSource(`${api.defaults.baseURL}/api/notifications/stream/`);

      eventSource.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        callback(notification);
      };

      eventSource.onerror = (error) => {
        console.error('Notification stream error:', error);
        // Implement reconnection logic
      };

      return {
        success: true,
        eventSource
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async unsubscribeFromNotifications(eventSource) {
    if (eventSource) {
      eventSource.close();
    }
    return { success: true };
  },

  // Push notification management
  async subscribeToPushNotifications(subscription) {
    try {
      const response = await api.post('/api/notifications/push/subscribe/', {
        subscription: JSON.stringify(subscription)
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async unsubscribeFromPushNotifications() {
    try {
      const response = await api.post('/api/notifications/push/unsubscribe/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Email notification management
  async sendTestEmail(email) {
    try {
      const response = await api.post('/api/notifications/test-email/', { email });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Admin notification management
  async createNotification(notificationData) {
    try {
      const response = await api.post('/api/notifications/admin/create/', notificationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async sendBulkNotification(notificationData, userIds = null) {
    try {
      const payload = { ...notificationData };
      if (userIds) {
        payload.user_ids = userIds;
      }
      const response = await api.post('/api/notifications/admin/bulk-send/', payload);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getNotificationAnalytics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/notifications/analytics/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Notification templates (admin)
  async getNotificationTemplates() {
    try {
      const response = await api.get('/api/notifications/templates/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async createNotificationTemplate(templateData) {
    try {
      const response = await api.post('/api/notifications/templates/', templateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async updateNotificationTemplate(templateId, templateData) {
    try {
      const response = await api.put(`/api/notifications/templates/${templateId}/`, templateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async deleteNotificationTemplate(templateId) {
    try {
      await api.delete(`/api/notifications/templates/${templateId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  }
};

export default notificationsService;
