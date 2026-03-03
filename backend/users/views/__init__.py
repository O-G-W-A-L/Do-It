"""
Users views module - split into multiple files by responsibility.

All views are re-exported here so existing imports like:
    from users.views import UserManagementViewSet
continue working unchanged.
"""

# Authentication views
from .auth import (
    CustomConfirmEmailView,
    MyTokenObtainPairView,
    GoogleLogin,
    register,
    verify_email,
    resend_verification,
    password_reset_request,
    password_reset_confirm,
    get_user,
    setup_status,
    setup_initialize,
)

# Profile views
from .profile import (
    UserMeView,
    get_user_preferences,
    update_user_preferences,
    get_user_learning_data,
    get_user_enrollments,
)

# Security views
from .security import (
    get_user_security_dashboard,
    logout_session,
    logout_all_sessions,
    calculate_security_score,
)

# Invitation views
from .invitations import (
    send_admin_invitation,
    accept_admin_invitation,
)

# Management views
from .management import (
    StandardResultsSetPagination,
    UserManagementViewSet,
)

# Dashboard views
from .dashboard import (
    admin_dashboard,
    admin_stats,
)


__all__ = [
    # Authentication
    'CustomConfirmEmailView',
    'MyTokenObtainPairView',
    'GoogleLogin',
    'register',
    'verify_email',
    'resend_verification',
    'password_reset_request',
    'password_reset_confirm',
    'get_user',
    'setup_status',
    'setup_initialize',
    # Profile
    'UserMeView',
    'get_user_preferences',
    'update_user_preferences',
    'get_user_learning_data',
    'get_user_enrollments',
    # Security
    'get_user_security_dashboard',
    'logout_session',
    'logout_all_sessions',
    'calculate_security_score',
    # Invitations
    'send_admin_invitation',
    'accept_admin_invitation',
    # Management
    'StandardResultsSetPagination',
    'UserManagementViewSet',
    # Dashboard
    'admin_dashboard',
    'admin_stats',
]