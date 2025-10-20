import { useState, useCallback } from 'react';
import { progressService } from '../services/progress.js';

/**
 * Custom hook for learning progress tracking
 */
export function useProgress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user progress
  const getUserProgress = useCallback(async (userId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await progressService.getUserProgress(userId);
      if (result.success) {
        setProgress(result.data.results || result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch progress');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get course progress
  const getCourseProgress = useCallback(async (courseId, userId = null) => {
    try {
      const result = await progressService.getCourseProgress(courseId, userId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch course progress');
      return null;
    }
  }, []);

  // Update lesson progress
  const updateLessonProgress = useCallback(async (courseId, lessonId, progressData) => {
    try {
      const result = await progressService.updateLessonProgress(courseId, lessonId, progressData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to update lesson progress');
      return null;
    }
  }, []);

  // Mark lesson complete
  const markLessonComplete = useCallback(async (courseId, lessonId, completionData = {}) => {
    try {
      const result = await progressService.markLessonComplete(courseId, lessonId, completionData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to mark lesson complete');
      return null;
    }
  }, []);

  // Quiz management
  const getQuiz = useCallback(async (quizId) => {
    try {
      const result = await progressService.getQuiz(quizId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch quiz');
      return null;
    }
  }, []);

  const submitQuiz = useCallback(async (quizId, answers) => {
    try {
      const result = await progressService.submitQuiz(quizId, answers);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to submit quiz');
      return null;
    }
  }, []);

  const getQuizResults = useCallback(async (quizId, attemptId = null) => {
    try {
      const result = await progressService.getQuizResults(quizId, attemptId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch quiz results');
      return null;
    }
  }, []);

  // Assignment management
  const getAssignments = useCallback(async (courseId = null, params = {}) => {
    try {
      const result = await progressService.getAssignments(courseId, params);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assignments');
      return null;
    }
  }, []);

  const submitAssignment = useCallback(async (assignmentId, submissionData) => {
    try {
      const result = await progressService.submitAssignment(assignmentId, submissionData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to submit assignment');
      return null;
    }
  }, []);

  // Certificate management
  const getCertificates = useCallback(async (userId = null) => {
    try {
      const result = await progressService.getCertificates(userId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch certificates');
      return null;
    }
  }, []);

  const generateCertificate = useCallback(async (courseId) => {
    try {
      const result = await progressService.generateCertificate(courseId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to generate certificate');
      return null;
    }
  }, []);

  const downloadCertificate = useCallback(async (certificateId) => {
    try {
      const result = await progressService.downloadCertificate(certificateId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to download certificate');
      return null;
    }
  }, []);

  // Achievements and analytics
  const getAchievements = useCallback(async (userId = null) => {
    try {
      const result = await progressService.getAchievements(userId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch achievements');
      return null;
    }
  }, []);

  const getLearningAnalytics = useCallback(async (userId = null, params = {}) => {
    try {
      const result = await progressService.getLearningAnalytics(userId, params);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch learning analytics');
      return null;
    }
  }, []);

  return {
    progress,
    loading,
    error,
    getUserProgress,
    getCourseProgress,
    updateLessonProgress,
    markLessonComplete,
    getQuiz,
    submitQuiz,
    getQuizResults,
    getAssignments,
    submitAssignment,
    getCertificates,
    generateCertificate,
    downloadCertificate,
    getAchievements,
    getLearningAnalytics,
    // Utility functions
    clearError: () => setError(null),
    setProgress: setProgress
  };
}
