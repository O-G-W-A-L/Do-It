import axios from 'axios';

// Create base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
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
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh token
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh/`,
          { refresh: refreshToken }
        );

        // Save new tokens
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

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
    } else if (error.response?.status >= 500) {
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
  handleError: (error) => {
    if (error.response?.data) {
      // API error with response
      const data = error.response.data;
      if (typeof data === 'object') {
        // Extract first error message
        const firstKey = Object.keys(data)[0];
        return data[firstKey]?.[0] || data[firstKey] || 'An error occurred';
      }
      return data;
    }
    return error.message || 'An unexpected error occurred';
  },

  // Check if error is authentication related
  isAuthError: (error) => {
    return error.response?.status === 401;
  },

  // Check if error is permission related
  isPermissionError: (error) => {
    return error.response?.status === 403;
  },

  // Format data for FormData (file uploads)
  createFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          data[key].forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return formData;
  }
};

export default api;
