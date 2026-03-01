import api, { apiUtils } from './api';
import type { ServiceResponse } from '../types/api/user';
import type { Notification, NotificationPreferences, Announcement } from '../types/api/notification';

/**
 * Notification service for notification-related API calls
 */
export const notificationService = {
  // Get all notifications
  async getNotifications(): Promise<ServiceResponse<Notification[]>> {
    try {
      const response = await api.get<Notification[]>('/api/notifications/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get unread notifications count
  async getUnreadCount(): Promise<ServiceResponse<number>> {
    try {
      const response = await api.get<number>('/api/notifications/unread-count/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<ServiceResponse<Notification>> {
    try {
      const response = await api.patch<Notification>(`/api/notifications/${notificationId}/read/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Mark all as read
  async markAllAsRead(): Promise<ServiceResponse<null>> {
    try {
      await api.post('/api/notifications/mark-all-read/');
      return { success: true };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Delete notification
  async deleteNotification(notificationId: number): Promise<ServiceResponse<null>> {
    try {
      await api.delete(`/api/notifications/${notificationId}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get notification preferences
  async getPreferences(): Promise<ServiceResponse<NotificationPreferences>> {
    try {
      const response = await api.get<NotificationPreferences>('/api/notifications/preferences/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Update notification preferences
  async updatePreferences(preferences: NotificationPreferences): Promise<ServiceResponse<NotificationPreferences>> {
    try {
      const response = await api.patch<NotificationPreferences>('/api/notifications/preferences/', preferences);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get announcements
  async getAnnouncements(): Promise<ServiceResponse<Announcement[]>> {
    try {
      const response = await api.get<Announcement[]>('/api/announcements/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  }
};

export default notificationService;
