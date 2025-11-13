from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    get_user, MyTokenObtainPairView, CustomConfirmEmailView,
    register, verify_email, resend_verification,
    password_reset_request, password_reset_confirm,
    get_user_enrollments, UserManagementViewSet, UserMeView,
    send_admin_invitation, accept_admin_invitation,
    # Enhanced profile endpoints
    get_user_preferences, update_user_preferences,
    get_user_security_dashboard, logout_session, logout_all_sessions,
    get_user_learning_data,
)

router = DefaultRouter()
router.register(r'', UserManagementViewSet, basename='user-management')

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

    # Enhanced profile management
    path('profile/preferences/', get_user_preferences, name='user-preferences'),
    path('profile/preferences/update/', update_user_preferences, name='update-user-preferences'),
    path('profile/security/', get_user_security_dashboard),
    path('profile/logout-session/<int:session_id>/', logout_session),
    path('profile/logout-all-sessions/', logout_all_sessions),
    path('profile/learning-data/', get_user_learning_data),

    # Admin management (router URLs)
    path('management/', include(router.urls)),

    # Admin invitation system
    path('admin/send-invitation/', send_admin_invitation),
    path('admin/accept-invitation/<uuid:token>/', accept_admin_invitation),
]
