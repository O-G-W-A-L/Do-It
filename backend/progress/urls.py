from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LessonProgressViewSet, QuizSubmissionViewSet, AssignmentSubmissionViewSet,
    QuizQuestionViewSet, student_progress_dashboard, instructor_analytics_dashboard,
    unlock_content
)

router = DefaultRouter()
router.register(r'', LessonProgressViewSet, basename='progress')
router.register(r'quiz-submissions', QuizSubmissionViewSet)
router.register(r'assignment-submissions', AssignmentSubmissionViewSet)
router.register(r'quiz-questions', QuizQuestionViewSet)

urlpatterns = [
    # ViewSet endpoints
    path('', include(router.urls)),

    # Dashboard endpoints
    path('dashboard/student/', student_progress_dashboard, name='student-progress-dashboard'),
    path('dashboard/instructor/', instructor_analytics_dashboard, name='instructor-analytics-dashboard'),

    # Utility endpoints
    path('unlock-content/', unlock_content, name='unlock-content'),
]
