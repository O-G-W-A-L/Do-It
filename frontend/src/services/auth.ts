import api, { apiUtils } from './api';
import type { 
  User, 
  LoginResponse, 
  ServiceResponse 
} from '../types/api/user';

/**
 * Authentication service for user management
 */
export const authService = {
  // User authentication
  async login(credentials: { username: string; password: string }): Promise<ServiceResponse<LoginResponse>> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login/', credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async register(userData: { 
    username: string; 
    email: string; 
    password1: string; 
    password2: string 
  }): Promise<ServiceResponse<unknown>> {
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

  async logout(): Promise<ServiceResponse<null>> {
    try {
      await api.post('/api/auth/logout/');
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, we clear local tokens
      return { success: true };
    }
  },

  // Token management
  async refreshToken(): Promise<ServiceResponse<{ access: string; refresh: string }>> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<{ access: string; refresh: string }>('/api/auth/refresh/', {
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
  async getCurrentUser(): Promise<ServiceResponse<User>> {
    try {
      const response = await api.get<User>('/api/auth/user/');
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

  async updateProfile(userData: Partial<User>): Promise<ServiceResponse<User>> {
    try {
      const response = await api.patch<User>('/api/auth/user/', userData);
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
  async changePassword(passwordData: { 
    old_password: string; 
    new_password: string; 
    new_password2: string 
  }): Promise<ServiceResponse<unknown>> {
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

  async resetPassword(email: string): Promise<ServiceResponse<unknown>> {
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

  async confirmPasswordReset(tokenData: { 
    token: string; 
    new_password: string 
  }): Promise<ServiceResponse<unknown>> {
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
  async resendVerification(email: string): Promise<ServiceResponse<unknown>> {
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

  async verifyEmail(key: string): Promise<ServiceResponse<unknown>> {
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
  async googleLogin(token: string): Promise<ServiceResponse<LoginResponse>> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/google/', { access_token: token });
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
