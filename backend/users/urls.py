from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    get_user, MyTokenObtainPairView, CustomConfirmEmailView,
    register, verify_email, resend_verification,
    password_reset_request, password_reset_confirm,
    get_user_enrollments, UserManagementViewSet, UserMeView,
)

router = DefaultRouter()
router.register(r'management', UserManagementViewSet, basename='user-management')

urlpatterns = [
    # User profile endpoints
    path('user/', get_user),
    path('users/me/', UserMeView.as_view()),

    # Authentication endpoints
    path('login/', MyTokenObtainPairView.as_view(), name='custom_login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Registration endpoints
    path('registration/', register),
    path('registration/verify-email/', verify_email),
    path('registration/resend-verification/', resend_verification),

    # Password reset endpoints
    path('password-reset/', password_reset_request),
    path('password-reset-confirm/', password_reset_confirm),

    # User functionality
    path('enrollments/', get_user_enrollments),

    # Admin management (router URLs)
    path('management/', include(router.urls)),
]
