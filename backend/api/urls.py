from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    hello_world,
    get_user,
    MyTokenObtainPairView,
    TaskViewSet, ProjectViewSet, RoutineViewSet,
    GoalViewSet, FileAttachmentViewSet, NotificationViewSet,
    CustomConfirmEmailView,
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
    path('auth/user/', get_user),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='custom_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path(
        'auth/registration/account-confirm-email/<str:key>/',
        CustomConfirmEmailView.as_view(),
        name='account_confirm_email'
    ),

    # dj-rest-auth endpoints
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),

    # All app routes
    path('', include(router.urls)),
]
