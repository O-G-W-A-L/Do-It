import api, { apiUtils } from './api.js';

/**
 * Analytics service for dashboard analytics and business intelligence
 */
export const analyticsService = {
  // Dashboard statistics
  async getDashboardStats() {
    try {
      const response = await api.get('/api/analytics/dashboard-stats/');
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

  // User engagement analytics
  async getUserEngagement(userId = null) {
    try {
      const url = userId ? `/api/analytics/user-engagement/${userId}/` : '/api/analytics/user-engagement/';
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

  // Course performance analytics
  async getCoursePerformance(courseId) {
    try {
      const response = await api.get(`/api/analytics/course-performance/${courseId}/`);
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

  // Revenue analytics
  async getRevenueAnalytics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/analytics/revenue/${queryString ? `?${queryString}` : ''}`;
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

  // Learning recommendations
  async getLearningRecommendations() {
    try {
      const response = await api.get('/api/analytics/learning-recommendations/');
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

  // Event tracking
  async trackEvent(eventData) {
    try {
      const response = await api.post('/api/analytics/track-event/', eventData);
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

  // Analytics reports
  async getReports(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/analytics/reports/${queryString ? `?${queryString}` : ''}`;
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

  async getReport(reportId) {
    try {
      const response = await api.get(`/api/analytics/reports/${reportId}/`);
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

  async createReport(reportData) {
    try {
      const response = await api.post('/api/analytics/reports/', reportData);
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

  async updateReport(reportId, reportData) {
    try {
      const response = await api.put(`/api/analytics/reports/${reportId}/`, reportData);
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

  async deleteReport(reportId) {
    try {
      await api.delete(`/api/analytics/reports/${reportId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async generateReport(reportId) {
    try {
      const response = await api.post(`/api/analytics/reports/${reportId}/generate/`);
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

  async downloadReport(reportId) {
    try {
      const response = await api.get(`/api/analytics/reports/${reportId}/download/`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'report.pdf'
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Analytics dashboards
  async getDashboards() {
    try {
      const response = await api.get('/api/analytics/dashboards/');
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

  async getDashboard(dashboardId) {
    try {
      const response = await api.get(`/api/analytics/dashboards/${dashboardId}/`);
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

  async createDashboard(dashboardData) {
    try {
      const response = await api.post('/api/analytics/dashboards/', dashboardData);
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

  async updateDashboard(dashboardId, dashboardData) {
    try {
      const response = await api.put(`/api/analytics/dashboards/${dashboardId}/`, dashboardData);
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

  async deleteDashboard(dashboardId) {
    try {
      await api.delete(`/api/analytics/dashboards/${dashboardId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async recordDashboardView(dashboardId) {
    try {
      const response = await api.post(`/api/analytics/dashboards/${dashboardId}/view/`);
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

  // Learning recommendations
  async getLearningRecommendations() {
    try {
      const response = await api.get('/api/analytics/learning-recommendations/');
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

  // Predictive analytics
  async getPredictiveAnalytics(data) {
    try {
      const response = await api.post('/api/analytics/predictive/', data);
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

  // Data export
  async getDataExports(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/analytics/exports/${queryString ? `?${queryString}` : ''}`;
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

  async createDataExport(exportData) {
    try {
      const response = await api.post('/api/analytics/exports/', exportData);
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

  async downloadDataExport(exportId) {
    try {
      const response = await api.get(`/api/analytics/exports/${exportId}/download/`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'export.zip'
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Metrics and KPIs
  async getMetrics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/analytics/metrics/${queryString ? `?${queryString}` : ''}`;
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

  async calculateMetrics(calculationData) {
    try {
      const response = await api.post('/api/analytics/metrics/calculate/', calculationData);
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

  // Custom analytics queries
  async executeCustomQuery(queryData) {
    try {
      const response = await api.post('/api/analytics/query/', queryData);
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

  // Real-time analytics
  async subscribeToRealTimeAnalytics(callback, filters = {}) {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const url = `${api.defaults.baseURL}/api/analytics/realtime/${queryString ? `?${queryString}` : ''}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data);
      };

      eventSource.onerror = (error) => {
        console.error('Real-time analytics error:', error);
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

  async unsubscribeFromRealTimeAnalytics(eventSource) {
    if (eventSource) {
      eventSource.close();
    }
    return { success: true };
  }
};

export default analyticsService;
