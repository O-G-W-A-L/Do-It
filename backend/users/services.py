"""
Service layer for users app.
Separates business logic from Profile model.
"""
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from datetime import timedelta

# Import centralized constants
from core.constants import SecurityConstants


class ProfileService:
    """
    Service for profile-related business logic.
    Profile model should only hold data, not behavior.
    """
    
    @staticmethod
    @transaction.atomic
    def increment_failed_login(profile):
        """
        Increment failed login attempts atomically.
        Returns the updated profile.
        """
        # Use F() for atomic update
        Profile.objects.filter(pk=profile.pk).update(
            failed_login_attempts=F('failed_login_attempts') + 1
        )
        
        # Refresh to get new value
        profile.refresh_from_db()
        
        # Check if should lock - use centralized constants
        if profile.failed_login_attempts >= SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS:
            profile.account_locked_until = timezone.now() + timedelta(
                minutes=SecurityConstants.LOCKOUT_DURATION_MINUTES
            )
            profile.save(update_fields=['account_locked_until'])
        
        return profile
    
    @staticmethod
    @transaction.atomic
    def reset_failed_login(profile):
        """
        Reset failed login attempts after successful login.
        """
        profile.failed_login_attempts = 0
        profile.account_locked_until = None
        profile.save(update_fields=['failed_login_attempts', 'account_locked_until'])
        
        # Update User.last_login separately
        User = profile.user.__class__
        User.objects.filter(pk=profile.user.pk).update(last_login=timezone.now())
        
        return profile
    
    @staticmethod
    def check_profile_completion(profile):
        """
        Check if profile is complete enough for certain actions.
        Returns (is_complete: bool, missing_fields: list)
        """
        missing = []
        
        if not profile.full_name:
            missing.append('full_name')
        if not profile.bio:
            missing.append('bio')
        if not profile.profile_image:
            missing.append('profile_image')
        
        return len(missing) == 0, missing
    
    @staticmethod
    def can_enroll_in_course(profile, course):
        """
        Check if profile can enroll in a specific course.
        """
        if not profile.is_student:
            return False, "Not a student"
        
        if profile.account_locked_until and profile.account_locked_until > timezone.now():
            return False, "Account is locked"
        
        return True, None
    
    @staticmethod
    @transaction.atomic
    def update_enrollment_count(profile, delta):
        """
        Update enrollment count atomically.
        delta: +1 for enrollment, -1 for unenrollment
        """
        Profile.objects.filter(pk=profile.pk).update(
            enrolled_courses_count=F('enrolled_courses_count') + delta
        )
        profile.refresh_from_db()
        return profile


class UserRegistrationService:
    """
    Service for user registration - separates business logic from serializers.
    """
    
    @staticmethod
    def register_user(username, email, password):
        """
        Register a new user with email verification.
        Returns (user, error)
        """
        from django.contrib.auth.models import User
        from users.models import EmailVerification
        from django.conf import settings
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=True
        )
        
        # Create email verification
        ev = EmailVerification.objects.create(user=user)
        
        # Send verification email (commented out for testing)
        # verify_url = f"{settings.FRONTEND_URL}/verify-email/{ev.token}/"
        # send_mail(...)
        
        return user, None
    
    @staticmethod
    def verify_email(token):
        """
        Verify user email with token.
        Returns (user, error)
        """
        from users.models import EmailVerification
        from django.contrib.auth.models import User
        
        try:
            ev = EmailVerification.objects.get(token=token)
        except EmailVerification.DoesNotExist:
            return None, "Invalid token"
        
        if not ev.is_valid():
            return None, "Token expired or already used"
        
        # Mark verification as used
        ev.used = True
        ev.save()
        
        # Activate user
        user = ev.user
        user.is_active = True
        user.save()
        
        return user, None
    
    @staticmethod
    def resend_verification(user):
        """
        Resend verification email.
        Returns (success, error)
        """
        from users.models import EmailVerification
        
        # Check existing unused tokens
        existing = EmailVerification.objects.filter(user=user, used=False)
        if existing.exists():
            return False, "Verification email already sent"
        
        # Create new verification
        ev = EmailVerification.objects.create(user=user)
        
        # Send email (commented out for testing)
        # verify_url = f"{settings.FRONTEND_URL}/verify-email/{ev.token}/"
        # send_mail(...)
        
        return True, None


# Import at module level (after defining all methods to avoid circular import issues)
from django.db.models import F
from users.models import Profile
