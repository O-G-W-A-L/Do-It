import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useCourses } from '../hooks/useCourses';
import { useEnrollments } from '../hooks/useEnrollments';
import { useAuth } from './AuthContext';
import type { CourseListItem, Enrollment } from '../types/api/course';

interface CourseFilters {
  category: string;
  level: string;
  search: string;
  sort: 'newest' | 'oldest' | 'popular' | 'rating';
}

interface CourseProgressSummary {
  progress: number;
  status: string;
  completedAt: string | null;
  enrolledAt: string;
}

interface CourseContextType {
  courses: CourseListItem[];
  enrollments: Enrollment[];
  selectedCourse: CourseListItem | null;
  courseFilters: CourseFilters;
  isLoading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  getCourse: (slugOrId: string | number) => Promise<CourseListItem | null>;
  searchCourses: (query: string) => Promise<void>;
  createCourse: (data: Partial<CourseListItem>) => Promise<CourseListItem | null>;
  updateCourse: (id: number, data: Partial<CourseListItem>) => Promise<CourseListItem | null>;
  deleteCourse: (id: number) => Promise<boolean>;
  enrollInCourse: (courseId: number, enrollmentData?: Record<string, unknown>) => Promise<Enrollment | null>;
  unenrollFromCourse: (courseId: number) => Promise<boolean>;
  getEnrollment: (courseId: number) => Promise<Enrollment | null>;
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
  getRecommendedCourses: (userId?: number | null, limit?: number) => CourseListItem[];
  getCourseProgressSummary: (courseId: number) => CourseProgressSummary | null;
  setSelectedCourse: (course: CourseListItem | null) => void;
  setCourseFilters: (filters: Partial<CourseFilters>) => void;
  clearError: () => void;
  refreshData: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
}

export function CourseProvider({ children }: CourseProviderProps) {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<CourseListItem | null>(null);
  const [courseFilters, setCourseFilters] = useState<CourseFilters>({
    category: '',
    level: '',
    search: '',
    sort: 'newest'
  });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Use the hooks
  const coursesHook = useCourses();
  const enrollmentsHook = useEnrollments();

  // Combined state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reactive data loading - only load when user is authenticated
  useEffect(() => {
    const userId = user?.id;

    // If user changed (compare IDs, not objects), clear old data and fetch fresh data
    if (currentUserId !== userId) {
      if (currentUserId !== null && currentUserId !== undefined) {
        // User actually changed - clear all data
        enrollmentsHook.setEnrollments([]);
        coursesHook.setCourses([]);
      }

      setCurrentUserId(userId ?? null);

      // Only fetch data when we have an authenticated user
      if (userId) {
        const loadUserData = async () => {
          setIsLoading(true);
          try {
            // Load courses and enrollments in parallel for authenticated user
            await Promise.all([
              coursesHook.fetchCourses(),
              enrollmentsHook.fetchEnrollments()
            ]);
          } catch {
            setError('Failed to load course data');
          } finally {
            setIsLoading(false);
          }
        };

        loadUserData();
      } else {
        // No user - clear loading state
        setIsLoading(false);
      }
    }
  }, [user?.id, currentUserId, coursesHook, enrollmentsHook]);

  // Provide clearData function for AuthContext logout
  useEffect(() => {
    window.courseContextClearData = () => {
      enrollmentsHook.setEnrollments([]);
      coursesHook.setCourses([]);
      setSelectedCourse(null);
      setCurrentUserId(null);
    };

    return () => {
      delete window.courseContextClearData;
    };
  }, [enrollmentsHook, coursesHook]);

  // Enhanced course operations
  const enrollInCourse = useCallback(async (courseId: number, enrollmentData: Record<string, unknown> = {}): Promise<Enrollment | null> => {
    const result = await enrollmentsHook.enrollInCourse(courseId, enrollmentData);
    if (result) {
      // Refresh courses to update enrollment counts
      await coursesHook.fetchCourses();
    }
    return result;
  }, [enrollmentsHook, coursesHook]);

  const unenrollFromCourse = useCallback(async (courseId: number): Promise<boolean> => {
    const result = await enrollmentsHook.unenrollFromCourse(courseId);
    if (result) {
      // Refresh courses to update enrollment counts
      await coursesHook.fetchCourses();
    }
    return result;
  }, [enrollmentsHook, coursesHook]);

  // Course filtering and search
  const filteredCourses = useMemo((): CourseListItem[] => {
    let filtered = Array.isArray(coursesHook.courses) ? coursesHook.courses : [];

    if (courseFilters.search) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(courseFilters.search.toLowerCase()) ||
        course.description?.toLowerCase().includes(courseFilters.search.toLowerCase())
      );
    }

    if (courseFilters.category) {
      filtered = filtered.filter(course => (course as unknown as { category: string }).category === courseFilters.category);
    }

    if (courseFilters.level) {
      filtered = filtered.filter(course => course.level === courseFilters.level);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (courseFilters.sort) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'popular':
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [coursesHook.courses, courseFilters]);

  // Course recommendations
  const getRecommendedCourses = useCallback((userId: number | null = null, limit: number = 6): CourseListItem[] => {
    // Simple recommendation logic - can be enhanced with ML
    const enrolledCourseIds = Array.isArray(enrollmentsHook.enrollments)
      ? enrollmentsHook.enrollments.map(e => e.course)
      : [];
    const recommended = Array.isArray(coursesHook.courses) ? coursesHook.courses
      .filter(course => !enrolledCourseIds.includes(course.id))
      .sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0))
      .slice(0, limit) : [];

    return recommended;
  }, [coursesHook.courses, enrollmentsHook.enrollments]);

  // Course progress summary
  const getCourseProgressSummary = useCallback((courseId: number): CourseProgressSummary | null => {
    const enrollment = enrollmentsHook.enrollments.find(e => e.course === courseId);
    return enrollment ? {
      progress: enrollment.progress_percentage || 0,
      status: enrollment.status,
      completedAt: enrollment.completed_at,
      enrolledAt: enrollment.enrolled_at
    } : null;
  }, [enrollmentsHook.enrollments]);

  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
    coursesHook.clearError();
    enrollmentsHook.clearError();
  }, [coursesHook, enrollmentsHook]);

  // Update filters
  const updateCourseFilters = useCallback((filters: Partial<CourseFilters>) => {
    setCourseFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const contextValue: CourseContextType = {
    // State
    courses: filteredCourses,
    enrollments: enrollmentsHook.enrollments,
    selectedCourse,
    courseFilters,
    isLoading: isLoading || coursesHook.loading || enrollmentsHook.loading,
    error: error || coursesHook.error || enrollmentsHook.error,

    // Course operations
    fetchCourses: coursesHook.fetchCourses,
    getCourse: coursesHook.getCourse,
    searchCourses: coursesHook.searchCourses,
    createCourse: coursesHook.createCourse,
    updateCourse: coursesHook.updateCourse,
    deleteCourse: coursesHook.deleteCourse,

    // Enrollment operations
    enrollInCourse,
    unenrollFromCourse,
    getEnrollment: enrollmentsHook.getEnrollment,

    // Course reviews
    getCourseReviews: coursesHook.getCourseReviews,
    createReview: coursesHook.createReview,

    // Categories and utilities
    getCategories: coursesHook.getCategories,
    getInstructorCourses: coursesHook.getInstructorCourses,

    // Module and lesson operations
    getCourseModules: coursesHook.getCourseModules,
    createModule: coursesHook.createModule,
    updateModule: coursesHook.updateModule,
    getModuleLessons: coursesHook.getModuleLessons,
    createLesson: coursesHook.createLesson,
    updateLesson: coursesHook.updateLesson,

    // Enhanced features
    getRecommendedCourses,
    getCourseProgressSummary,
    setSelectedCourse,
    setCourseFilters: updateCourseFilters,

    // Utility functions
    clearError,
    refreshData: async () => {
      await Promise.all([
        coursesHook.fetchCourses(),
        enrollmentsHook.fetchEnrollments()
      ]);
    }
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
}

export const useCourseContext = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
};
