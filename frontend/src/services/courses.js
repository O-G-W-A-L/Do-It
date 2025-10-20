import api, { apiUtils } from './api.js';

/**
 * Course service for course management and enrollment
 */
export const coursesService = {
  // Course listing and discovery
  async getCourses(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/courses/courses/${queryString ? `?${queryString}` : ''}`;
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

  async getCourse(courseId) {
    try {
      const response = await api.get(`/api/courses/courses/${courseId}/`);
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

  async searchCourses(query, filters = {}) {
    try {
      const params = { search: query, ...filters };
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/api/courses/search/?${queryString}`);
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

  // Course creation and management (instructors/admins)
  async createCourse(courseData) {
    try {
      const response = await api.post('/api/courses/courses/', courseData);
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

  async updateCourse(courseId, courseData) {
    try {
      const response = await api.put(`/api/courses/courses/${courseId}/`, courseData);
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

  async deleteCourse(courseId) {
    try {
      await api.delete(`/api/courses/courses/${courseId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Course modules and lessons
  async getCourseModules(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/modules/`);
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

  async createModule(courseId, moduleData) {
    try {
      const response = await api.post(`/api/courses/${courseId}/modules/`, moduleData);
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

  async updateModule(courseId, moduleId, moduleData) {
    try {
      const response = await api.put(`/api/courses/${courseId}/modules/${moduleId}/`, moduleData);
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

  async getModuleLessons(courseId, moduleId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/modules/${moduleId}/lessons/`);
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

  async createLesson(courseId, moduleId, lessonData) {
    try {
      const response = await api.post(`/api/courses/${courseId}/modules/${moduleId}/lessons/`, lessonData);
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

  async updateLesson(courseId, moduleId, lessonId, lessonData) {
    try {
      const response = await api.put(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`, lessonData);
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

  // Enrollment management
  async enrollInCourse(courseId, enrollmentData = {}) {
    try {
      const response = await api.post(`/api/courses/courses/${courseId}/enroll/`, enrollmentData);
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

  async unenrollFromCourse(courseId) {
    try {
      await api.post(`/api/courses/${courseId}/unenroll/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  async getEnrollments(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/courses/enrollments/${queryString ? `?${queryString}` : ''}`;
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

  async getEnrollment(courseId) {
    try {
      const response = await api.get(`/api/courses/${courseId}/enrollment/`);
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

  // Course reviews and ratings
  async getCourseReviews(courseId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/courses/${courseId}/reviews/${queryString ? `?${queryString}` : ''}`;
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

  async createReview(courseId, reviewData) {
    try {
      const response = await api.post(`/api/courses/${courseId}/reviews/`, reviewData);
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

  async updateReview(courseId, reviewId, reviewData) {
    try {
      const response = await api.put(`/api/courses/${courseId}/reviews/${reviewId}/`, reviewData);
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

  // Course categories and tags
  async getCategories() {
    try {
      const response = await api.get('/api/courses/categories/');
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

  async getTags() {
    try {
      const response = await api.get('/api/courses/tags/');
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

  // Instructor courses
  async getInstructorCourses(instructorId = null) {
    try {
      const url = instructorId
        ? `/api/courses/instructor/${instructorId}/`
        : '/api/courses/instructor/';
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

  // File uploads for courses
  async uploadCourseMedia(courseId, file, mediaType = 'thumbnail') {
    try {
      const formData = apiUtils.createFormData({
        file,
        media_type: mediaType
      });
      const response = await api.post(`/api/courses/${courseId}/upload/`, formData, {
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
  }
};
