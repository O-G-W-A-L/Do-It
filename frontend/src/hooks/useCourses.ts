import { useState, useCallback } from 'react';
import { courseService } from '../services/courses';
import type { CourseListItem, Course } from '../types/api/course';

interface UseCoursesReturn {
  courses: CourseListItem[];
  loading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  getCourse: (slugOrId: string | number) => Promise<CourseListItem | null>;
  searchCourses: (query: string) => Promise<void>;
  createCourse: (data: Partial<CourseListItem>) => Promise<CourseListItem | null>;
  updateCourse: (id: number, data: Partial<CourseListItem>) => Promise<CourseListItem | null>;
  deleteCourse: (id: number) => Promise<boolean>;
  setCourses: (courses: CourseListItem[]) => void;
  clearError: () => void;
  getCourseReviews: (courseId: number) => Promise<unknown>;
  createReview: (courseId: number, data: unknown) => Promise<unknown>;
  getCategories: () => Promise<string[]>;
  getInstructorCourses: (instructorId: number) => Promise<CourseListItem[]>;
  getCourseModules: (courseId: number) => Promise<unknown>;
  createModule: (courseId: number, data: unknown) => Promise<unknown>;
  updateModule: (moduleId: number, data: unknown) => Promise<unknown>;
  getModuleLessons: (moduleId: number) => Promise<unknown>;
  createLesson: (moduleId: number, data: unknown) => Promise<unknown>;
  updateLesson: (lessonId: number, data: unknown) => Promise<unknown>;
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.getCourses();
      if (result.success && result.data) {
        setCourses(result.data);
      } else {
        setError(result.error || 'Failed to fetch courses');
      }
    } catch {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCourse = useCallback(async (slugOrId: string | number): Promise<CourseListItem | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.getCourse(slugOrId);
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.error || 'Failed to fetch course');
      return null;
    } catch {
      setError('Failed to fetch course');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCourses = useCallback(async (query: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.searchCourses(query);
      if (result.success && result.data) {
        setCourses(result.data);
      } else {
        setError(result.error || 'Failed to search courses');
      }
    } catch {
      setError('Failed to search courses');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCourse = useCallback(async (data: Partial<Course>): Promise<CourseListItem | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.createCourse(data);
      if (result.success && result.data) {
        await fetchCourses();
        return result.data as unknown as CourseListItem;
      }
      setError(result.error || 'Failed to create course');
      return null;
    } catch {
      setError('Failed to create course');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const updateCourse = useCallback(async (id: number, data: Partial<Course>): Promise<CourseListItem | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.updateCourse(id, data);
      if (result.success && result.data) {
        await fetchCourses();
        return result.data as unknown as CourseListItem;
      }
      setError(result.error || 'Failed to update course');
      return null;
    } catch {
      setError('Failed to update course');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const deleteCourse = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await courseService.deleteCourse(id);
      if (result.success) {
        await fetchCourses();
        return true;
      }
      setError(result.error || 'Failed to delete course');
      return false;
    } catch {
      setError('Failed to delete course');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const getCourseReviews = useCallback(async (courseId: number): Promise<unknown> => {
    try {
      const result = await courseService.getCourse(courseId);
      if (result.success && result.data) {
        return result.data.reviews;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const createReview = useCallback(async (_courseId: number, _data: unknown): Promise<unknown> => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch {
      setError('Failed to create review');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      const result = await courseService.getCourses();
      if (result.success && result.data) {
        return [];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const getInstructorCourses = useCallback(async (instructorId: number): Promise<CourseListItem[]> => {
    try {
      const result = await courseService.getInstructorCourses(instructorId);
      if (result.success && result.data) {
        return result.data as unknown as CourseListItem[];
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const getCourseModules = useCallback(async (courseId: number): Promise<unknown> => {
    try {
      const result = await courseService.getCourse(courseId);
      if (result.success && result.data) {
        return result.data.modules;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const createModule = useCallback(async (_courseId: number, _data: unknown): Promise<unknown> => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch {
      setError('Failed to create module');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateModule = useCallback(async (_moduleId: number, _data: unknown): Promise<unknown> => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch {
      setError('Failed to update module');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getModuleLessons = useCallback(async (_moduleId: number): Promise<unknown> => {
    try {
      return [];
    } catch {
      return [];
    }
  }, []);

  const createLesson = useCallback(async (_moduleId: number, _data: unknown): Promise<unknown> => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch {
      setError('Failed to create lesson');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLesson = useCallback(async (_lessonId: number, _data: unknown): Promise<unknown> => {
    setLoading(true);
    setError(null);
    try {
      return null;
    } catch {
      setError('Failed to update lesson');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    getCourse,
    searchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    setCourses,
    clearError,
    getCourseReviews,
    createReview,
    getCategories,
    getInstructorCourses,
    getCourseModules,
    createModule,
    updateModule,
    getModuleLessons,
    createLesson,
    updateLesson
  };
}
