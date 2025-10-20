import uuid
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist

def default_expiry():
    """
    Return a timezone‐aware datetime 24 hours from now.
    Named function so Django migrations can serialize it.
    """
    return timezone.now() + timedelta(hours=24)


class EmailVerification(models.Model):
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    token    = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created  = models.DateTimeField(auto_now_add=True)
    expires  = models.DateTimeField(default=default_expiry)
    used     = models.BooleanField(default=False)

    def is_valid(self):
        return (not self.used) and (timezone.now() < self.expires)

    def __str__(self):
        return f"EmailVerification(token={self.token}, user={self.user.username})"


class Profile(models.Model):
    USER_ROLES = [
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=USER_ROLES, default='student')

    # Basic profile information
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)

    # LMS-specific fields
    is_profile_complete = models.BooleanField(default=False)
    enrolled_courses_count = models.PositiveIntegerField(default=0)
    completed_courses_count = models.PositiveIntegerField(default=0)

    # Instructor-specific fields
    assigned_courses_count = models.PositiveIntegerField(default=0)
    is_active_instructor = models.BooleanField(default=False)

    # Security fields
    failed_login_attempts = models.PositiveIntegerField(default=0)
    account_locked_until = models.DateTimeField(blank=True, null=True)
    last_password_change = models.DateTimeField(auto_now_add=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['role', 'is_active_instructor']),
            models.Index(fields=['user', 'role']),
        ]

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.get_role_display()})"

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_instructor(self):
        return self.role == 'instructor'

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_account_locked(self):
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False

    def increment_failed_login(self):
        """Increment failed login attempts and lock account if threshold reached."""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:  # Lock after 5 failed attempts
            self.account_locked_until = timezone.now() + timedelta(minutes=30)
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])

    def reset_failed_login(self):
        """Reset failed login attempts on successful login."""
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])

    def check_profile_completion(self):
        """Check if profile is complete based on role requirements."""
        required_fields = ['bio', 'location', 'phone_number']
        if self.role == 'instructor':
            required_fields.append('profile_image')

        self.is_profile_complete = all(getattr(self, field) for field in required_fields)
        self.save(update_fields=['is_profile_complete'])
        return self.is_profile_complete

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        try:
            instance.profile.save()
        except ObjectDoesNotExist:
            Profile.objects.create(user=instance)
