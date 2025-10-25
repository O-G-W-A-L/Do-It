import { useState, useEffect, useCallback } from 'react';
import { coursesService } from '../services/courses.js';

/**
 * Custom hook for course management
 */
export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch courses with optional filters
  const fetchCourses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.getCourses(params);
      if (result.success) {
        setCourses(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch courses');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single course
  const getCourse = useCallback(async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.getCourse(courseId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch course');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search courses
  const searchCourses = useCallback(async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.searchCourses(query, filters);
      if (result.success) {
        setCourses(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to search courses');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create course (instructor/admin)
  const createCourse = useCallback(async (courseData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.createCourse(courseData);
      if (result.success) {
        setCourses(prev => [result.data, ...prev]);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create course');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update course
  const updateCourse = useCallback(async (courseId, courseData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.updateCourse(courseId, courseData);
      if (result.success) {
        setCourses(prev => prev.map(course =>
          course.id === courseId ? result.data : course
        ));
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to update course');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete course
  const deleteCourse = useCallback(async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.deleteCourse(courseId);
      if (result.success) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to delete course');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enroll in course
  const enrollInCourse = useCallback(async (courseId, enrollmentData = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.enrollInCourse(courseId, enrollmentData);
      if (result.success) {
        // Update course enrollment count if needed
        setCourses(prev => prev.map(course =>
          course.id === courseId
            ? { ...course, enrollment_count: (course.enrollment_count || 0) + 1 }
            : course
        ));
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
        // Update course enrollment count if needed
        setCourses(prev => prev.map(course =>
          course.id === courseId
            ? { ...course, enrollment_count: Math.max((course.enrollment_count || 0) - 1, 0) }
            : course
        ));
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

  // Get course reviews
  const getCourseReviews = useCallback(async (courseId, params = {}) => {
    try {
      const result = await coursesService.getCourseReviews(courseId, params);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch course reviews');
      return null;
    }
  }, []);

  // Create course review
  const createReview = useCallback(async (courseId, reviewData) => {
    try {
      const result = await coursesService.createReview(courseId, reviewData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create review');
      return null;
    }
  }, []);

  // Get course categories
  const getCategories = useCallback(async () => {
    try {
      const result = await coursesService.getCategories();
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      return null;
    }
  }, []);

  // Get instructor courses
  const getInstructorCourses = useCallback(async (instructorId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await coursesService.getInstructorCourses(instructorId);
      if (result.success) {
        if (!instructorId) {
          // If fetching current user's courses, update state
          setCourses(result.data.results || result.data);
        }
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch instructor courses');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get course modules
  const getCourseModules = useCallback(async (courseId) => {
    try {
      const result = await coursesService.getCourseModules(courseId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch course modules');
      return null;
    }
  }, []);

  // Create module
  const createModule = useCallback(async (moduleData) => {
    try {
      const result = await coursesService.createModule(moduleData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create module');
      return null;
    }
  }, []);

  // Update module
  const updateModule = useCallback(async (moduleId, moduleData) => {
    try {
      const result = await coursesService.updateModule(moduleId, moduleData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to update module');
      return null;
    }
  }, []);

  // Get module lessons
  const getModuleLessons = useCallback(async (moduleId) => {
    try {
      const result = await coursesService.getModuleLessons(moduleId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch module lessons');
      return null;
    }
  }, []);

  // Create lesson
  const createLesson = useCallback(async (lessonData) => {
    try {
      const result = await coursesService.createLesson(lessonData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to create lesson');
      return null;
    }
  }, []);

  // Update lesson
  const updateLesson = useCallback(async (lessonId, lessonData) => {
    try {
      const result = await coursesService.updateLesson(lessonId, lessonData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to update lesson');
      return null;
    }
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
    enrollInCourse,
    unenrollFromCourse,
    getCourseReviews,
    createReview,
    getCategories,
    getInstructorCourses,
    // Module and lesson operations
    getCourseModules,
    createModule,
    updateModule,
    getModuleLessons,
    createLesson,
    updateLesson,
    // Utility functions
    clearError: () => setError(null),
    setCourses: setCourses
  };
}
