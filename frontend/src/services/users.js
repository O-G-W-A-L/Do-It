import api, { apiUtils } from './api.js';

/**
 * User service for user management and profiles
 */
export const usersService = {
  // User profile management
  async getProfile(userId = null) {
    try {
      const url = userId ? `/api/users/${userId}/` : '/api/users/profile/';
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

  async updateProfile(userData, userId = null) {
    try {
      const url = userId ? `/api/users/${userId}/` : '/api/users/profile/';
      const response = await api.patch(url, userData);
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

  async uploadProfileImage(file) {
    try {
      const formData = apiUtils.createFormData({ profile_image: file });
      const response = await api.post('/api/users/profile/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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

  // User search and discovery
  async searchUsers(query, filters = {}) {
    try {
      const params = { search: query, ...filters };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/api/users/search/?${queryString}`);
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

  async getUsers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/users/${queryString ? `?${queryString}` : ''}`;
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

  // User roles and permissions
  async getUserRoles(userId = null) {
    try {
      const url = userId ? `/api/users/${userId}/roles/` : '/api/users/roles/';
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

  async updateUserRole(userId, roleData) {
    try {
      const response = await api.patch(`/api/users/${userId}/roles/`, roleData);
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

  // User statistics and analytics
  async getUserStats(userId = null) {
    try {
      const url = userId ? `/api/users/${userId}/stats/` : '/api/users/stats/';
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

  async getUserActivity(userId = null, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const baseUrl = userId ? `/api/users/${userId}/activity/` : '/api/users/activity/';
      const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`;
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

  // User preferences and settings
  async getUserPreferences() {
    try {
      const response = await api.get('/api/users/preferences/');
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

  async updateUserPreferences(preferences) {
    try {
      const response = await api.patch('/api/users/preferences/', preferences);
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

  // User notifications settings
  async getNotificationSettings() {
    try {
      const response = await api.get('/api/users/notifications/settings/');
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

  async updateNotificationSettings(settings) {
    try {
      const response = await api.patch('/api/users/notifications/settings/', settings);
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

  // Admin functions
  async deactivateUser(userId, reason = '') {
    try {
      const response = await api.post(`/api/users/${userId}/deactivate/`, { reason });
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

  async reactivateUser(userId) {
    try {
      const response = await api.post(`/api/users/${userId}/reactivate/`);
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

  async deleteUser(userId, confirmDelete = false) {
    try {
      const response = await api.delete(`/api/users/${userId}/`, {
        data: { confirm_delete: confirmDelete }
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

  // Bulk operations (admin)
  async bulkUpdateUsers(userIds, updates) {
    try {
      const response = await api.post('/api/users/bulk-update/', {
        user_ids: userIds,
        updates
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

  async exportUsers(filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `/api/users/export/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'users.csv'
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  }
};

export default usersService;
