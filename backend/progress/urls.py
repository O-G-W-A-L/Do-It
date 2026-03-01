from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LessonProgressViewSet, QuizSubmissionViewSet, AssignmentSubmissionViewSet,
    QuizQuestionViewSet, student_progress_dashboard, instructor_analytics_dashboard,
    unlock_content, mentor_dashboard, cohort_detail, cohort_submissions, override_grade
)

router = DefaultRouter()
# IMPORTANT: Register specific routes BEFORE empty string
router.register(r'quiz-submissions', QuizSubmissionViewSet)
router.register(r'assignment-submissions', AssignmentSubmissionViewSet)
router.register(r'quiz-questions', QuizQuestionViewSet)
router.register(r'', LessonProgressViewSet, basename='progress')

urlpatterns = [
    # ViewSet endpoints
    path('', include(router.urls)),

    # Dashboard endpoints
    path('dashboard/student/', student_progress_dashboard, name='student-progress-dashboard'),
    path('dashboard/instructor/', instructor_analytics_dashboard, name='instructor-analytics-dashboard'),
    
    # Doit Mentor dashboard endpoints
    path('dashboard/mentor/', mentor_dashboard, name='mentor-dashboard'),
    path('mentor/cohorts/<int:cohort_id>/', cohort_detail, name='cohort-detail'),
    path('mentor/cohorts/<int:cohort_id>/submissions/', cohort_submissions, name='cohort-submissions'),
    path('mentor/submissions/<int:submission_id>/override/', override_grade, name='override-grade'),

    # Utility endpoints
    path('unlock-content/', unlock_content, name='unlock-content'),
]
