"""
Centralized constants for Do-It application.
All magic numbers and configurable values should be defined here.
"""

# =============================================================================
# SECURITY CONSTANTS
# =============================================================================

class SecurityConstants:
    """Security-related constants"""
    MAX_FAILED_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 30
    PASSWORD_CHANGE_RECOMMENDED_DAYS = 90
    
    # Security score
    SECURITY_SCORE_BASE = 50
    SECURITY_SCORE_MAX = 100
    SCORE_PROFILE_COMPLETE = 10
    SCORE_PASSWORD_RECENT = 10
    SCORE_NO_FAILED_LOGINS = 10
    SCORE_ACCOUNT_NOT_LOCKED = 10
    SCORE_PROFILE_IMAGE = 5
    SCORE_PHONE_NUMBER = 5


# =============================================================================
# UPLOAD CONSTANTS
# =============================================================================

class UploadConstants:
    """File upload limits"""
    MAX_THUMBNAIL_SIZE_MB = 5
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']


# =============================================================================
# NOTIFICATION CONSTANTS
# =============================================================================

class NotificationConstants:
    """Notification-related constants"""
    MAX_RETRIES = 3


# =============================================================================
# PAGINATION CONSTANTS
# =============================================================================

class PaginationConstants:
    """Pagination defaults"""
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100


# =============================================================================
# PAYMENT CONSTANTS
# =============================================================================

class PaymentConstants:
    """Payment-related constants"""
    DEFAULT_CURRENCY = 'USD'
