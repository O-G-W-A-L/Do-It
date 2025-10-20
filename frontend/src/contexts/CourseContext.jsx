import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCourses } from '../hooks/useCourses.js';
import { useEnrollments } from '../hooks/useEnrollments.js';

const CourseContext = createContext();

export function CourseProvider({ children }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseFilters, setCourseFilters] = useState({
    category: '',
    level: '',
    search: '',
    sort: 'newest'
  });

  // Use the hooks
  const coursesHook = useCourses();
  const enrollmentsHook = useEnrollments();

  // Combined state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize courses on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Load courses and enrollments in parallel
        await Promise.all([
          coursesHook.fetchCourses(),
          enrollmentsHook.fetchEnrollments()
        ]);
      } catch (err) {
        setError('Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Enhanced course operations
  const enrollInCourse = useCallback(async (courseId, enrollmentData = {}) => {
    const result = await enrollmentsHook.enrollInCourse(courseId, enrollmentData);
    if (result) {
      // Refresh courses to update enrollment counts
      await coursesHook.fetchCourses();
    }
    return result;
  }, [enrollmentsHook, coursesHook]);

  const unenrollFromCourse = useCallback(async (courseId) => {
    const result = await enrollmentsHook.unenrollFromCourse(courseId);
    if (result) {
      // Refresh courses to update enrollment counts
      await coursesHook.fetchCourses();
    }
    return result;
  }, [enrollmentsHook, coursesHook]);

  // Course filtering and search
  const filteredCourses = React.useMemo(() => {
    let filtered = Array.isArray(coursesHook.courses) ? coursesHook.courses : [];

    if (courseFilters.search) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(courseFilters.search.toLowerCase()) ||
        course.description?.toLowerCase().includes(courseFilters.search.toLowerCase())
      );
    }

    if (courseFilters.category) {
      filtered = filtered.filter(course => course.category === courseFilters.category);
    }

    if (courseFilters.level) {
      filtered = filtered.filter(course => course.level === courseFilters.level);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (courseFilters.sort) {
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
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
  const getRecommendedCourses = useCallback((userId = null, limit = 6) => {
    // Simple recommendation logic - can be enhanced with ML
    const enrolledCourseIds = enrollmentsHook.enrollments.map(e => e.course);
    const recommended = coursesHook.courses
      .filter(course => !enrolledCourseIds.includes(course.id))
      .sort((a, b) => (b.enrollment_count || 0) - (a.enrollment_count || 0))
      .slice(0, limit);

    return recommended;
  }, [coursesHook.courses, enrollmentsHook.enrollments]);

  // Course progress summary
  const getCourseProgressSummary = useCallback((courseId) => {
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

  const contextValue = {
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

    // Enhanced features
    getRecommendedCourses,
    getCourseProgressSummary,
    setSelectedCourse,
    setCourseFilters,

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

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
};
