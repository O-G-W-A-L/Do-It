import { useState, useCallback } from 'react';
import { coursesService } from '../services/courses.js';

/**
 * Custom hook for enrollment management
 */
export function useEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user enrollments
  const fetchEnrollments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.getEnrollments(params);
      if (result.success) {
        setEnrollments(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch enrollments');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get specific enrollment
  const getEnrollment = useCallback(async (courseId) => {
    try {
      const result = await coursesService.getEnrollment(courseId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch enrollment');
      return null;
    }
  }, []);

  // Enroll in course
  const enrollInCourse = useCallback(async (courseId, enrollmentData = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.enrollInCourse(courseId, enrollmentData);
      if (result.success) {
        setEnrollments(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to enroll in course');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unenroll from course
  const unenrollFromCourse = useCallback(async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.unenrollFromCourse(courseId);
      if (result.success) {
        setEnrollments(prev => prev.filter(enrollment => enrollment.course !== courseId));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to unenroll from course');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enrollments,
    loading,
    error,
    fetchEnrollments,
    getEnrollment,
    enrollInCourse,
    unenrollFromCourse,
    // Utility functions
    clearError: () => setError(null),
    setEnrollments: setEnrollments
  };
}
