import api, { apiUtils } from './api';
import type { ServiceResponse } from '../types/api/user';
import type { 
  Course, 
  CourseListItem, 
  Enrollment,
  CourseSearchParams,
  Module,
  Lesson,
  CreateModuleData,
  UpdateModuleData,
  CreateLessonData,
  UpdateLessonData
} from '../types/api/course';

/**
 * Course service for course-related API calls
 */
export const courseService = {
  // Get all courses (with pagination and filters) - use /api/courses/courses/ for actual data
  async getCourses(params?: CourseSearchParams): Promise<ServiceResponse<CourseListItem[]>> {
    try {
      const response = await api.get<{results: CourseListItem[]}>('/api/courses/courses/', { params });
      return {
        success: true,
        data: response.data.results
      };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Get single course with full details - use /api/courses/courses/{id}/
  async getCourse(slugOrId: string | number): Promise<ServiceResponse<Course>> {
    try {
      const url = typeof slugOrId === 'number' 
        ? `/api/courses/courses/${slugOrId}/` 
        : `/api/courses/courses/${slugOrId}/`;
      const response = await api.get<Course>(url);
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

  // Create a new course - use /api/courses/courses/ for creation
  async createCourse(courseData: Partial<Course>): Promise<ServiceResponse<Course>> {
    try {
      const response = await api.post<Course>('/api/courses/courses/', courseData);
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

  // Update a course - use /api/courses/courses/{id}/
  async updateCourse(id: number, courseData: Partial<Course>): Promise<ServiceResponse<Course>> {
    try {
      const response = await api.patch<Course>(`/api/courses/courses/${id}/`, courseData);
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

  // Delete a course - use /api/courses/courses/{id}/
  async deleteCourse(id: number): Promise<ServiceResponse<null>> {
    try {
      await api.delete(`/api/courses/courses/${id}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Enroll in a course - it's a detail action: /api/courses/{course_id}/enroll/
  async enrollInCourse(courseId: number, couponCode?: string): Promise<ServiceResponse<Enrollment>> {
    try {
      const data = couponCode ? { coupon_code: couponCode } : {};
      const response = await api.post<Enrollment>(`/api/courses/courses/${courseId}/enroll/`, data);
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

  // Get user's enrollments
  async getEnrollments(): Promise<ServiceResponse<Enrollment[]>> {
    try {
      const response = await api.get<Enrollment[]>('/api/courses/enrollments/');
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

  // Get single enrollment
  async getEnrollment(courseId: number): Promise<ServiceResponse<Enrollment>> {
    try {
      const response = await api.get<Enrollment>(`/api/courses/enrollments/${courseId}/`);
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

  // Get courses by instructor
  async getInstructorCourses(instructorId: number): Promise<ServiceResponse<Course[]>> {
    try {
      const response = await api.get<Course[]>(`/api/courses/instructor/${instructorId}/`);
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

  // Search courses
  async searchCourses(query: string): Promise<ServiceResponse<CourseListItem[]>> {
    try {
      const response = await api.get<CourseListItem[]>('/api/courses/search/', { 
        params: { q: query } 
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

  // Get featured courses
  async getFeaturedCourses(): Promise<ServiceResponse<CourseListItem[]>> {
    try {
      const response = await api.get<CourseListItem[]>('/api/courses/featured/');
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

  // Get modules for a course (returns array directly, not paginated)
  async getCourseModules(courseId: number): Promise<ServiceResponse<Module[]>> {
    try {
      const response = await api.get<Module[]>(`/api/courses/modules/`, {
        params: { course: courseId }
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

  // Create a module
  async createModule(data: CreateModuleData): Promise<ServiceResponse<Module>> {
    try {
      const response = await api.post<Module>(`/api/courses/modules/`, {
        course: data.course,
        title: data.title,
        description: data.description || '',
        order: data.order
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

  // Update a module
  async updateModule(moduleId: number, data: UpdateModuleData): Promise<ServiceResponse<Module>> {
    try {
      const response = await api.patch<Module>(`/api/courses/modules/${moduleId}/`, data);
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

  // Delete a module
  async deleteModule(moduleId: number): Promise<ServiceResponse<null>> {
    try {
      await api.delete(`/api/courses/modules/${moduleId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Create a lesson
  async createLesson(data: CreateLessonData): Promise<ServiceResponse<Lesson>> {
    try {
      const response = await api.post<Lesson>(`/api/courses/lessons/`, {
        module: data.module,
        title: data.title,
        content: data.content || '',
        content_type: data.content_type || 'text',
        order: data.order
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

  // Update a lesson
  async updateLesson(lessonId: number, data: UpdateLessonData): Promise<ServiceResponse<Lesson>> {
    try {
      const response = await api.patch<Lesson>(`/api/courses/lessons/${lessonId}/`, data);
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

  // Delete a lesson
  async deleteLesson(lessonId: number): Promise<ServiceResponse<null>> {
    try {
      await api.delete(`/api/courses/lessons/${lessonId}/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: apiUtils.handleError(error)
      };
    }
  },

  // Publish a course - use /api/courses/courses/{id}/publish/
  async publishCourse(courseId: number): Promise<ServiceResponse<Course>> {
    try {
      const response = await api.post<Course>(`/api/courses/courses/${courseId}/publish/`);
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

  // Unpublish a course - use /api/courses/courses/{id}/unpublish/
  async unpublishCourse(courseId: number): Promise<ServiceResponse<Course>> {
    try {
      const response = await api.post<Course>(`/api/courses/courses/${courseId}/unpublish/`);
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

export default courseService;

// Alias for compatibility
export const coursesService = courseService;
