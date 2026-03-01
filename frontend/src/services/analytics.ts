import api, { apiUtils } from './api';
import type { ServiceResponse } from '../types/api/user';
import type { CourseAnalytics, UserAnalytics, DashboardStats } from '../types/api/analytics';

/**
 * Analytics service for analytics-related API calls
 */
export const analyticsService = {
  // Get dashboard stats
  async getDashboardStats(): Promise<ServiceResponse<DashboardStats>> {
    try {
      const response = await api.get<DashboardStats>('/api/analytics/dashboard/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get course analytics
  async getCourseAnalytics(courseId: number): Promise<ServiceResponse<CourseAnalytics>> {
    try {
      const response = await api.get<CourseAnalytics>(`/api/analytics/courses/${courseId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get user analytics
  async getUserAnalytics(): Promise<ServiceResponse<UserAnalytics>> {
    try {
      const response = await api.get<UserAnalytics>('/api/analytics/user/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get revenue analytics
  async getRevenueAnalytics(params?: { start_date?: string; end_date?: string }): Promise<ServiceResponse<unknown>> {
    try {
      const response = await api.get<unknown>('/api/analytics/revenue/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get enrollment analytics
  async getEnrollmentAnalytics(params?: { course_id?: number }): Promise<ServiceResponse<unknown>> {
    try {
      const response = await api.get<unknown>('/api/analytics/enrollments/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  }
};

export default analyticsService;
