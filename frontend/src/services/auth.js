import api, { apiUtils } from './api.js';

/**
 * Authentication service for user management
 */
export const authService = {
  // User authentication
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login/', credentials);
      return {
        success: true,
        data: response.data,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/api/auth/registration/', userData);
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

  async logout() {
    try {
      await api.post('/api/auth/logout/');
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, we clear local tokens
      return { success: true };
    }
  },

  // Token management
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh/', {
        refresh: refreshToken
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

  // User profile
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/user/');
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

  async updateProfile(userData) {
    try {
      const response = await api.patch('/api/auth/user/', userData);
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

  // Password management
  async changePassword(passwordData) {
    try {
      const response = await api.post('/api/auth/password/change/', passwordData);
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

  async resetPassword(email) {
    try {
      const response = await api.post('/api/auth/password/reset/', { email });
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

  async confirmPasswordReset(tokenData) {
    try {
      const response = await api.post('/api/auth/password/reset/confirm/', tokenData);
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

  // Email verification
  async resendVerification(email) {
    try {
      const response = await api.post('/api/auth/resend-verification/', { email });
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

  async verifyEmail(key) {
    try {
      const response = await api.post('/api/auth/verify-email/', { key });
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

  // Social authentication
  async googleLogin(token) {
    try {
      const response = await api.post('/api/auth/google/', { access_token: token });
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
  }
};

export default authService;
