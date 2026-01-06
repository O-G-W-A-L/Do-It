import api, { apiUtils } from './api.js';

/**
 * Progress service for learning progress tracking and assessments
 */
export const progressService = {
  // Learning progress tracking
  async getUserProgress(userId = null) {
    try {
      const url = userId ? `/api/progress/user/${userId}/` : '/api/progress/';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getCourseProgress(courseId, userId = null) {
    try {
      const url = userId
        ? `/api/progress/course/${courseId}/user/${userId}/`
        : `/api/progress/course/${courseId}/`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async updateLessonProgress(courseId, lessonId, progressData) {
    try {
      const response = await api.post(`/api/progress/course/${courseId}/lesson/${lessonId}/`, progressData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async markLessonComplete(courseId, lessonId, completionData = {}) {
    try {
      // Create progress record and mark as completed
      const response = await api.post('/api/progress/', {
        lesson: lessonId,
        status: 'completed',
        ...completionData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Quiz and assessment management
  async getQuiz(quizId) {
    try {
      const response = await api.get(`/api/progress/quizzes/${quizId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async submitQuiz(quizId, answers) {
    try {
      const response = await api.post(`/api/progress/quizzes/${quizId}/submit/`, { answers });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getQuizResults(quizId, attemptId = null) {
    try {
      const url = attemptId
        ? `/api/progress/quizzes/${quizId}/results/${attemptId}/`
        : `/api/progress/quizzes/${quizId}/results/`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getQuizAttempts(quizId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/progress/quizzes/${quizId}/attempts/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Assignment management
  async getAssignments(courseId = null, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const baseUrl = courseId ? `/api/progress/course/${courseId}/assignments/` : '/api/progress/assignments/';
      const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getAssignment(assignmentId) {
    try {
      const response = await api.get(`/api/progress/assignments/${assignmentId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async submitAssignment(assignmentId, submissionData) {
    try {
      const formData = apiUtils.createFormData(submissionData);
      const response = await api.post(`/api/progress/assignments/${assignmentId}/submit/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getAssignmentSubmissions(assignmentId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/progress/assignments/${assignmentId}/submissions/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async gradeSubmission(submissionId, gradeData) {
    try {
      const response = await api.post(`/api/progress/submissions/${submissionId}/grade/`, gradeData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Certificate management
  async getCertificates(userId = null) {
    try {
      const url = userId ? `/api/progress/user/${userId}/certificates/` : '/api/progress/certificates/';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async generateCertificate(courseId) {
    try {
      const response = await api.post(`/api/progress/course/${courseId}/certificate/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async downloadCertificate(certificateId) {
    try {
      const response = await api.get(`/api/progress/certificates/${certificateId}/download/`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'certificate.pdf'
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Learning analytics
  async getLearningAnalytics(userId = null, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const baseUrl = userId ? `/api/progress/user/${userId}/analytics/` : '/api/progress/analytics/';
      const url = `${baseUrl}${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getCourseAnalytics(courseId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/progress/course/${courseId}/analytics/${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Achievement and badges
  async getAchievements(userId = null) {
    try {
      const url = userId ? `/api/progress/user/${userId}/achievements/` : '/api/progress/achievements/';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async unlockAchievement(achievementId) {
    try {
      const response = await api.post(`/api/progress/achievements/${achievementId}/unlock/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Study streaks and goals
  async getStudyStreaks(userId = null) {
    try {
      const url = userId ? `/api/progress/user/${userId}/streaks/` : '/api/progress/streaks/';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async updateStudyGoal(goalData) {
    try {
      const response = await api.post('/api/progress/goals/', goalData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  }
};

export default progressService;
