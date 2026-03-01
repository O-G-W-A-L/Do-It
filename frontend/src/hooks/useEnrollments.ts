import { useState, useCallback } from 'react';
import { courseService } from '../services/courses';
import type { Enrollment } from '../types/api/course';

interface UseEnrollmentsReturn {
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  fetchEnrollments: () => Promise<void>;
  enrollInCourse: (courseId: number, data?: Record<string, unknown>) => Promise<Enrollment | null>;
  unenrollFromCourse: (courseId: number) => Promise<boolean>;
  getEnrollment: (courseId: number) => Promise<Enrollment | null>;
  setEnrollments: (enrollments: Enrollment[]) => void;
  clearError: () => void;
}

export function useEnrollments(): UseEnrollmentsReturn {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.getEnrollments();
      if (result.success && result.data) {
        setEnrollments(result.data);
      } else {
        setError(result.error || 'Failed to fetch enrollments');
      }
    } catch {
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, []);

  const enrollInCourse = useCallback(async (courseId: number, data?: Record<string, unknown>): Promise<Enrollment | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.enrollInCourse(courseId, data?.couponCode);
      if (result.success && result.data) {
        await fetchEnrollments();
        return result.data;
      }
      setError(result.error || 'Failed to enroll in course');
      return null;
    } catch {
      setError('Failed to enroll in course');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEnrollments]);

  const unenrollFromCourse = useCallback(async (courseId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Implementation depends on API
      await fetchEnrollments();
      return true;
    } catch {
      setError('Failed to unenroll from course');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEnrollments]);

  const getEnrollment = useCallback(async (courseId: number): Promise<Enrollment | null> => {
    try {
      const result = await courseService.getEnrollment(courseId);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    enrollments,
    loading,
    error,
    fetchEnrollments,
    enrollInCourse,
    unenrollFromCourse,
    getEnrollment,
    setEnrollments,
    clearError
  };
}
