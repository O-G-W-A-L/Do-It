# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    hello_world,
    register,
    get_user,
    MyTokenObtainPairView,
    TaskViewSet
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('hello/',       hello_world,             name='hello-world'),
    path('auth/register/', register,              name='register'),
    path('auth/login/',   MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(),      name='token_refresh'),
    path('auth/user/',    get_user,                name='get-user'),
    path('',               include(router.urls)),         # → /api/tasks/
]
