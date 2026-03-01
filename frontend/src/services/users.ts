import api, { apiUtils } from './api';
import type { ServiceResponse, PaginatedResponse } from '../types/api/user';
import type { User, AdminUser, UserSession, LoginHistory, UserBan, UserPreferences } from '../types/api/user';

/**
 * User service for user management API calls
 */
export const userService = {
  // Get all users (admin only)
  async getUsers(params?: { page?: number; page_size?: number; search?: string }): Promise<ServiceResponse<PaginatedResponse<User>>> {
    try {
      const response = await api.get<PaginatedResponse<User>>('/api/users/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get single user
  async getUser(userId: number): Promise<ServiceResponse<User>> {
    try {
      const response = await api.get<User>(`/api/users/${userId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Update user (admin only)
  async updateUser(userId: number, userData: Partial<AdminUser>): Promise<ServiceResponse<User>> {
    try {
      const response = await api.patch<User>(`/api/users/${userId}/`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Create user (admin only)
  async createUser(userData: Partial<AdminUser>): Promise<ServiceResponse<User>> {
    try {
      const response = await api.post<User>('/api/users/', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Delete user (admin only)
  async deleteUser(userId: number): Promise<ServiceResponse<null>> {
    try {
      await api.delete(`/api/users/${userId}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get user sessions
  async getUserSessions(userId: number): Promise<ServiceResponse<UserSession[]>> {
    try {
      const response = await api.get<UserSession[]>(`/api/users/${userId}/sessions/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get login history
  async getLoginHistory(userId: number): Promise<ServiceResponse<LoginHistory[]>> {
    try {
      const response = await api.get<LoginHistory[]>(`/api/users/${userId}/login-history/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Ban user (admin only)
  async banUser(userId: number, banData: { ban_type: string; reason: string; expires_at?: string }): Promise<ServiceResponse<UserBan>> {
    try {
      const response = await api.post<UserBan>(`/api/users/${userId}/ban/`, banData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Unban user (admin only)
  async unbanUser(userId: number): Promise<ServiceResponse<UserBan>> {
    try {
      const response = await api.post<UserBan>(`/api/users/${userId}/unban/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get user preferences
  async getPreferences(): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await api.get<UserPreferences>('/api/users/preferences/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<ServiceResponse<UserPreferences>> {
    try {
      const response = await api.patch<UserPreferences>('/api/users/preferences/', preferences);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  }
};

export default userService;
