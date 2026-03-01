import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for error handling
export interface ApiError {
  message: string;
  status?: number;
  isAuthError?: boolean;
}

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Get tab-specific token
    const tabId = sessionStorage.getItem('tabId');
    const token = tabId 
      ? localStorage.getItem(`access_token_${tabId}`) 
      : localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Check if this is an enrollment request - handle differently
    const isEnrollmentRequest = originalRequest.url?.includes('/enroll/');

    // If 401 and we haven't retried yet, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get tab-specific refresh token
        const tabId = sessionStorage.getItem('tabId');
        const refreshToken = tabId 
          ? localStorage.getItem(`refresh_token_${tabId}`) 
          : localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh token
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh/`,
          { refresh: refreshToken }
        );

        // Save new tokens with tab-specific keys
        if (tabId) {
          localStorage.setItem(`access_token_${tabId}`, data.access);
          if (data.refresh) {
            localStorage.setItem(`refresh_token_${tabId}`, data.refresh);
          }
        } else {
          localStorage.setItem('access_token', data.access);
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
        }

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        return api(originalRequest);

      } catch (refreshError) {
        // For enrollment requests, don't redirect - let the component handle it
        if (isEnrollmentRequest) {
          // Create a custom error that the component can handle
          const authError = new Error('Authentication required. Please log in to enroll in courses.') as Error & ApiError;
          authError.isAuthError = true;
          authError.status = 401;
          return Promise.reject(authError);
        }

        // For other requests, refresh failed, clear tokens and redirect to login
        const tabId = sessionStorage.getItem('tabId');
        if (tabId) {
          localStorage.removeItem(`access_token_${tabId}`);
          localStorage.removeItem(`refresh_token_${tabId}`);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }

        // Dispatch custom event for auth context to handle logout
        window.dispatchEvent(new CustomEvent('auth:logout'));

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', error.response.data);
    } else if (error.response?.status && error.response.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API operations
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error: unknown): string => {
    if (axios.isAxiosError(error) && error.response?.data) {
      // API error with response
      const data = error.response.data;
      if (typeof data === 'object') {
        // Extract first error message
        const keys = Object.keys(data);
        if (keys.length > 0) {
        const firstKey = keys[0];
        const value = data[firstKey as keyof typeof data];
          if (Array.isArray(value) && value.length > 0) {
            return value[0];
          }
          if (typeof value === 'string') {
            return value;
          }
        }
        return 'An error occurred';
      }
      return String(data);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Check if error is authentication related
  isAuthError: (error: unknown): boolean => {
    if (axios.isAxiosError(error)) {
      return error.response?.status === 401;
    }
    if (typeof error === 'object' && error !== null && 'isAuthError' in error) {
      return (error as ApiError).isAuthError === true;
    }
    return false;
  },

  // Check if error is permission related
  isPermissionError: (error: unknown): boolean => {
    if (axios.isAxiosError(error)) {
      return error.response?.status === 403;
    }
    return false;
  },

  // Format data for FormData (file uploads)
  createFormData: (data: Record<string, unknown>): FormData => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else {
          formData.append(key, value as string | Blob);
        }
      }
    });
    return formData;
  }
};

// Generic API helpers
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await api.get(url, config);
  return response.data;
};

export const apiPost = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await api.post(url, data, config);
  return response.data;
};

export const apiPatch = async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await api.patch(url, data, config);
  return response.data;
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await api.delete(url, config);
  return response.data;
};

export default api;
