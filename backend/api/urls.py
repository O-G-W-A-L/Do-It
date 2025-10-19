from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import get_user, MyTokenObtainPairView, CustomConfirmEmailView
from .views import (
    TaskViewSet, ProjectViewSet, RoutineViewSet,
    GoalViewSet, FileAttachmentViewSet, NotificationViewSet,
    SubtaskViewSet, UserMeView, GoogleLogin,
    resend_verification, password_reset_request, password_reset_confirm,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'routines', RoutineViewSet)
router.register(r'goals', GoalViewSet)
router.register(r'files', FileAttachmentViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'subtasks', SubtaskViewSet)

urlpatterns = [
    path('auth/user/', get_user),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='custom_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path(
        'auth/registration/account-confirm-email/<str:key>/',
        CustomConfirmEmailView.as_view(),
        name='account_confirm_email'
    ),

    # Custom auth endpoints
    path('auth/resend-verification/', resend_verification),
    path('auth/password-reset/', password_reset_request),
    path('auth/password-reset-confirm/', password_reset_confirm),

    # dj-rest-auth endpoints
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # Google social login endpoint
    path('auth/social/google/', GoogleLogin.as_view(), name='google_login'),

    path('users/me/', UserMeView.as_view(), name='user-me'),
    
    # All other viewsets
    path('', include(router.urls)),
]
