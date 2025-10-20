import { useState, useCallback } from 'react';
import { analyticsService } from '../services/analytics.js';

/**
 * Custom hook for analytics and business intelligence
 */
export function useAnalytics() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard statistics
  const getDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getDashboardStats();
      if (result.success) {
        setDashboardStats(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // User engagement analytics
  const getUserEngagement = useCallback(async (userId = null) => {
    try {
      const result = await analyticsService.getUserEngagement(userId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user engagement');
      return null;
    }
  }, []);

  // Course performance analytics
  const getCoursePerformance = useCallback(async (courseId) => {
    try {
      const result = await analyticsService.getCoursePerformance(courseId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch course performance');
      return null;
    }
  }, []);

  // Revenue analytics
  const getRevenueAnalytics = useCallback(async (params = {}) => {
    try {
      const result = await analyticsService.getRevenueAnalytics(params);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch revenue analytics');
      return null;
    }
  }, []);

  // Learning recommendations
  const getLearningRecommendations = useCallback(async () => {
    try {
      const result = await analyticsService.getLearningRecommendations();
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch learning recommendations');
      return null;
    }
  }, []);

  // Event tracking
  const trackEvent = useCallback(async (eventData) => {
    try {
      const result = await analyticsService.trackEvent(eventData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to track event');
      return null;
    }
  }, []);

  // Reports management
  const getReports = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getReports(params);
      if (result.success) {
        setReports(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReport = useCallback(async (reportData) => {
    try {
      const result = await analyticsService.createReport(reportData);
      if (result.success) {
        setReports(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create report');
      return null;
    }
  }, []);

  const generateReport = useCallback(async (reportId) => {
    try {
      const result = await analyticsService.generateReport(reportId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
      return null;
    }
  }, []);

  const downloadReport = useCallback(async (reportId) => {
    try {
      const result = await analyticsService.downloadReport(reportId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to download report');
      return null;
    }
  }, []);

  // Analytics dashboards
  const getDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getDashboards();
      if (result.success) {
        setDashboards(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboards');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDashboard = useCallback(async (dashboardData) => {
    try {
      const result = await analyticsService.createDashboard(dashboardData);
      if (result.success) {
        setDashboards(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create dashboard');
      return null;
    }
  }, []);

  // Predictive analytics
  const getPredictiveAnalytics = useCallback(async (data) => {
    try {
      const result = await analyticsService.getPredictiveAnalytics(data);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to get predictive analytics');
      return null;
    }
  }, []);

  // Data export
  const createDataExport = useCallback(async (exportData) => {
    try {
      const result = await analyticsService.createDataExport(exportData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create data export');
      return null;
    }
  }, []);

  const downloadDataExport = useCallback(async (exportId) => {
    try {
      const result = await analyticsService.downloadDataExport(exportId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to download data export');
      return null;
    }
  }, []);

  return {
    dashboardStats,
    reports,
    dashboards,
    loading,
    error,
    getDashboardStats,
    getUserEngagement,
    getCoursePerformance,
    getRevenueAnalytics,
    getLearningRecommendations,
    trackEvent,
    getReports,
    createReport,
    generateReport,
    downloadReport,
    getDashboards,
    createDashboard,
    getPredictiveAnalytics,
    createDataExport,
    downloadDataExport,
    // Utility functions
    clearError: () => setError(null),
    setDashboardStats: setDashboardStats,
    setReports: setReports,
    setDashboards: setDashboards
  };
}
