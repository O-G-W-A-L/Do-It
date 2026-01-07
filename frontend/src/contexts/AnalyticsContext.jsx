import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { useAuth } from './AuthContext';

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  const { user } = useAuth();
  const [realTimeConnection, setRealTimeConnection] = useState(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    dateRange: '30d',
    userType: 'all',
    courseCategory: 'all'
  });

  // Use the analytics hook
  const analyticsHook = useAnalytics();

  // Initialize analytics data only for authenticated users
  useEffect(() => {
    if (user?.id) {
      const loadInitialData = async () => {
        try {
          // Load dashboard stats and reports
          await Promise.all([
            analyticsHook.getDashboardStats(),
            analyticsHook.getReports()
          ]);
        } catch (error) {
          console.error('Failed to load analytics data:', error);
        }
      };

      loadInitialData();
    }
  }, [user?.id]);

  // Enhanced analytics operations
  const getDashboardStats = useCallback(async () => {
    return await analyticsHook.getDashboardStats();
  }, [analyticsHook]);

  const getUserEngagement = useCallback(async (userId = null) => {
    return await analyticsHook.getUserEngagement(userId);
  }, [analyticsHook]);

  const getCoursePerformance = useCallback(async (courseId) => {
    return await analyticsHook.getCoursePerformance(courseId);
  }, [analyticsHook]);

  const getRevenueAnalytics = useCallback(async (params = {}) => {
    return await analyticsHook.getRevenueAnalytics({ ...analyticsFilters, ...params });
  }, [analyticsHook, analyticsFilters]);

  const getLearningRecommendations = useCallback(async () => {
    return await analyticsHook.getLearningRecommendations();
  }, [analyticsHook]);

  // Event tracking
  const trackEvent = useCallback(async (eventData) => {
    return await analyticsHook.trackEvent(eventData);
  }, [analyticsHook]);

  // Report management
  const createReport = useCallback(async (reportData) => {
    const result = await analyticsHook.createReport(reportData);
    if (result) {
      // Refresh reports after creation
      await analyticsHook.getReports();
    }
    return result;
  }, [analyticsHook]);

  const generateReport = useCallback(async (reportId) => {
    return await analyticsHook.generateReport(reportId);
  }, [analyticsHook]);

  const downloadReport = useCallback(async (reportId) => {
    return await analyticsHook.downloadReport(reportId);
  }, [analyticsHook]);

  // Dashboard management
  const createDashboard = useCallback(async (dashboardData) => {
    const result = await analyticsHook.createDashboard(dashboardData);
    if (result) {
      // Refresh dashboards after creation
      await analyticsHook.getDashboards();
    }
    return result;
  }, [analyticsHook]);

  // Predictive analytics
  const getPredictiveAnalytics = useCallback(async (data) => {
    return await analyticsHook.getPredictiveAnalytics(data);
  }, [analyticsHook]);

  // Data export
  const createDataExport = useCallback(async (exportData) => {
    return await analyticsHook.createDataExport(exportData);
  }, [analyticsHook]);

  const downloadDataExport = useCallback(async (exportId) => {
    return await analyticsHook.downloadDataExport(exportId);
  }, [analyticsHook]);

  // Real-time analytics
  const subscribeToRealTimeAnalytics = useCallback((callback) => {
    analyticsHook.subscribeToRealTimeAnalytics(callback, analyticsFilters)
      .then(result => {
        if (result.success) {
          setRealTimeConnection(result.eventSource);
        }
      })
      .catch(error => {
        console.error('Failed to subscribe to real-time analytics:', error);
      });
  }, [analyticsHook, analyticsFilters]);

  const unsubscribeFromRealTimeAnalytics = useCallback(() => {
    if (realTimeConnection) {
      analyticsHook.unsubscribeFromRealTimeAnalytics(realTimeConnection);
      setRealTimeConnection(null);
    }
  }, [analyticsHook, realTimeConnection]);

  // Analytics calculations and insights
  const getEngagementMetrics = useCallback(() => {
    const stats = analyticsHook.dashboardStats;
    if (!stats) return null;

    return {
      totalUsers: stats.total_users || 0,
      activeUsersToday: stats.active_users_today || 0,
      totalCourses: stats.total_courses || 0,
      totalEnrollments: stats.total_enrollments || 0,
      courseCompletionRate: stats.course_completion_rate || 0,
      averageSessionDuration: stats.average_session_duration || 0,
      userGrowth: calculateGrowth(stats), // Would need historical data
      engagementScore: calculateEngagementScore(stats)
    };
  }, [analyticsHook.dashboardStats]);

  const getRevenueMetrics = useCallback(() => {
    // This would be calculated from revenue analytics
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageTransactionValue: 0,
      conversionRate: 0,
      topRevenueCourses: [],
      revenueGrowth: 0
    };
  }, []);

  const getLearningMetrics = useCallback(() => {
    const stats = analyticsHook.dashboardStats;
    if (!stats) return null;

    return {
      totalCourses: stats.total_courses || 0,
      totalEnrollments: stats.total_enrollments || 0,
      completionRate: stats.course_completion_rate || 0,
      averageCompletionTime: 0, // Would need additional data
      popularCourses: stats.top_courses || [],
      courseEngagement: 0 // Would need additional calculations
    };
  }, [analyticsHook.dashboardStats]);

  // Helper functions for calculations
  const calculateGrowth = (stats) => {
    // Simplified growth calculation - would need historical data
    return 0;
  };

  const calculateEngagementScore = (stats) => {
    // Calculate engagement score based on various metrics
    const users = stats.total_users || 0;
    const active = stats.active_users_today || 0;
    const completions = stats.course_completion_rate || 0;

    return Math.min(100, ((active / Math.max(users, 1)) * 50) + (completions * 0.5));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realTimeConnection) {
        analyticsHook.unsubscribeFromRealTimeAnalytics(realTimeConnection);
      }
    };
  }, [analyticsHook, realTimeConnection]);

  const contextValue = {
    // State
    dashboardStats: analyticsHook.dashboardStats,
    reports: analyticsHook.reports,
    dashboards: analyticsHook.dashboards,
    analyticsFilters,
    realTimeConnection,
    isLoading: analyticsHook.loading,
    error: analyticsHook.error,

    // Analytics operations
    getDashboardStats,
    getUserEngagement,
    getCoursePerformance,
    getRevenueAnalytics,
    getLearningRecommendations,
    trackEvent,

    // Report operations
    getReports: analyticsHook.getReports,
    createReport,
    generateReport,
    downloadReport,

    // Dashboard operations
    getDashboards: analyticsHook.getDashboards,
    createDashboard,

    // Advanced analytics
    getPredictiveAnalytics,
    createDataExport,
    downloadDataExport,

    // Real-time features
    subscribeToRealTimeAnalytics,
    unsubscribeFromRealTimeAnalytics,

    // Calculated metrics
    getEngagementMetrics,
    getRevenueMetrics,
    getLearningMetrics,

    // Utility functions
    setAnalyticsFilters,
    clearError: analyticsHook.clearError,
    refreshData: async () => {
      await Promise.all([
        analyticsHook.getDashboardStats(),
        analyticsHook.getReports(),
        analyticsHook.getDashboards()
      ]);
    }
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
