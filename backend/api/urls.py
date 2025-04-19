from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    hello_world, register, get_user, MyTokenObtainPairView,
    TaskViewSet, ProjectViewSet, RoutineViewSet, GoalViewSet,
    FileAttachmentViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'routines', RoutineViewSet)
router.register(r'goals', GoalViewSet)
router.register(r'files', FileAttachmentViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('hello/', hello_world),
    path('auth/register/', register),
    path('auth/login/', MyTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/user/', get_user),
    path('', include(router.urls)),
]
