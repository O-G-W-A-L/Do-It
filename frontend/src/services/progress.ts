import api, { apiUtils } from './api';
import type { ServiceResponse } from '../types/api/user';
import type {
  LessonProgress,
  QuizSubmission,
  QuizQuestion,
  AssignmentSubmission,
  StudentAnalytics,
  ProgressSummary,
  ProgressUpdateRequest,
  QuizSubmissionRequest,
  AssignmentSubmissionRequest,
  GradingRequest,
  MentorDashboardResponse,
  CohortDetail,
  CohortSubmission,
  GradeOverrideRequest,
  GradeOverrideResponse
} from '../types/api/progress';

/**
 * Progress service for progress-related API calls
 */
export const progressService = {
  // Get lesson progress
  async getLessonProgress(lessonId: number): Promise<ServiceResponse<LessonProgress>> {
    try {
      const response = await api.get<LessonProgress>(`/api/progress/lessons/${lessonId}/progress/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get all progress for a course
  async getCourseProgress(courseId: number): Promise<ServiceResponse<LessonProgress[]>> {
    try {
      const response = await api.get<LessonProgress[]>(`/api/progress/courses/${courseId}/progress/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Update lesson progress
  async updateProgress(request: ProgressUpdateRequest): Promise<ServiceResponse<LessonProgress>> {
    try {
      const response = await api.post<LessonProgress>('/api/progress/update/', request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Mark a lesson as complete
  async markLessonComplete(lessonId: number): Promise<ServiceResponse<LessonProgress>> {
    try {
      // POST to /api/progress/ with lesson and status
      const response = await api.post<LessonProgress>('/api/progress/', {
        lesson: lessonId,
        status: 'completed'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get progress summary
  async getProgressSummary(courseId: number): Promise<ServiceResponse<ProgressSummary>> {
    try {
      const response = await api.get<ProgressSummary>(`/api/progress/courses/${courseId}/summary/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get quiz questions
  async getQuizQuestions(lessonId: number): Promise<ServiceResponse<QuizQuestion[]>> {
    try {
      const response = await api.get<QuizQuestion[]>(`/api/progress/lessons/${lessonId}/quiz/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Submit quiz
  async submitQuiz(request: QuizSubmissionRequest): Promise<ServiceResponse<QuizSubmission>> {
    try {
      const response = await api.post<QuizSubmission>('/api/progress/quiz/submit/', request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get quiz submissions
  async getQuizSubmissions(lessonId: number): Promise<ServiceResponse<QuizSubmission[]>> {
    try {
      const response = await api.get<QuizSubmission[]>(`/api/progress/lessons/${lessonId}/submissions/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Submit assignment
  async submitAssignment(request: AssignmentSubmissionRequest): Promise<ServiceResponse<AssignmentSubmission>> {
    try {
      const response = await api.post<AssignmentSubmission>('/api/progress/assignment/submit/', request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get assignment submissions
  async getAssignmentSubmissions(lessonId: number): Promise<ServiceResponse<AssignmentSubmission[]>> {
    try {
      const response = await api.get<AssignmentSubmission[]>(`/api/progress/lessons/${lessonId}/assignments/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Grade submission (instructor only)
  async gradeSubmission(request: GradingRequest): Promise<ServiceResponse<QuizSubmission | AssignmentSubmission>> {
    try {
      const response = await api.post<QuizSubmission | AssignmentSubmission>('/api/progress/grade/', request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get student analytics
  async getStudentAnalytics(courseId: number): Promise<ServiceResponse<StudentAnalytics>> {
    try {
      const response = await api.get<StudentAnalytics>(`/api/progress/courses/${courseId}/analytics/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // ========== MENTOR DASHBOARD APIs ==========

  // Get mentor dashboard data (assigned cohorts)
  async getMentorDashboard(): Promise<ServiceResponse<MentorDashboardResponse>> {
    try {
      const response = await api.get<MentorDashboardResponse>('/api/progress/dashboard/mentor/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get cohort details with learner progress
  async getCohortDetails(cohortId: number): Promise<ServiceResponse<CohortDetail>> {
    try {
      const response = await api.get<CohortDetail>(`/api/progress/mentor/cohorts/${cohortId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Get submissions from cohort members for grading
  async getCohortSubmissions(cohortId: number): Promise<ServiceResponse<{ submissions: CohortSubmission[] }>> {
    try {
      const response = await api.get<{ submissions: CohortSubmission[] }>(`/api/progress/mentor/cohorts/${cohortId}/submissions/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  },

  // Override a submission grade
  async overrideGrade(submissionId: number, request: GradeOverrideRequest): Promise<ServiceResponse<GradeOverrideResponse>> {
    try {
      const response = await api.post<GradeOverrideResponse>(`/api/progress/mentor/submissions/${submissionId}/override/`, request);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: apiUtils.handleError(error) };
    }
  }
};

export default progressService;
