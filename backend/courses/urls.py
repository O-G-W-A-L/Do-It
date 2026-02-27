from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CourseViewSet, UnitViewSet, ModuleViewSet, LessonViewSet, EnrollmentViewSet,
    student_dashboard, instructor_dashboard, course_outline
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'units', UnitViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'enrollments', EnrollmentViewSet)

urlpatterns = [
    # ViewSet endpoints
    path('', include(router.urls)),

    # Dashboard endpoints
    path('dashboard/student/', student_dashboard, name='student-dashboard'),
    path('dashboard/instructor/', instructor_dashboard, name='instructor-dashboard'),
    
    # Course outline endpoint
    path('courses/<int:course_id>/outline/', course_outline, name='course-outline'),
]