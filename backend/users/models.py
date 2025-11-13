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


class AdminInvitation(models.Model):
    """
    Magic link invitations for admin/instructor accounts
    """
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=[('instructor', 'Instructor'), ('admin', 'Admin')],
        default='instructor'
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created = models.DateTimeField(auto_now_add=True)
    expires = models.DateTimeField(default=default_expiry)
    used = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires

    def accept(self, user):
        """Mark invitation as accepted and link to user"""
        self.used = True
        self.accepted_at = timezone.now()
        # Update user's profile role
        user.profile.role = self.role
        user.profile.save()
        self.save()

    def __str__(self):
        return f"Invitation for {self.email} ({self.role})"

    class Meta:
        ordering = ['-created']


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


class UserSession(models.Model):
    """
    Track active user sessions for security management.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_key']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.ip_address}"


class LoginHistory(models.Model):
    """
    Audit trail for user login attempts and security events.
    """
    LOGIN_SUCCESS = 'success'
    LOGIN_FAILED = 'failed'
    LOGOUT = 'logout'
    PASSWORD_RESET = 'password_reset'
    ACCOUNT_LOCKED = 'account_locked'

    EVENT_TYPES = [
        (LOGIN_SUCCESS, 'Login Success'),
        (LOGIN_FAILED, 'Login Failed'),
        (LOGOUT, 'Logout'),
        (PASSWORD_RESET, 'Password Reset'),
        (ACCOUNT_LOCKED, 'Account Locked'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history', null=True, blank=True)
    email = models.EmailField()  # Store email in case user is deleted
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(blank=True, null=True)  # Additional context

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['email', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.email} - {self.get_event_type_display()} - {self.timestamp}"


class UserBan(models.Model):
    """
    Temporary or permanent user bans with reasons.
    """
    BAN_TYPES = [
        ('temporary', 'Temporary'),
        ('permanent', 'Permanent'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bans')
    ban_type = models.CharField(max_length=20, choices=BAN_TYPES, default='temporary')
    reason = models.TextField()
    banned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bans_issued')
    banned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-banned_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.ban_type} ban"

    @property
    def is_expired(self):
        if self.ban_type == 'permanent':
            return False
        return self.expires_at and timezone.now() > self.expires_at


class UserStatus(models.Model):
    """
    Advanced user status management (suspension, expiration, etc.)
    """
    STATUS_TYPES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('expired', 'Expired'),
        ('pending_verification', 'Pending Verification'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='status')
    status = models.CharField(max_length=20, choices=STATUS_TYPES, default='active')
    reason = models.TextField(blank=True)
    set_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='status_changes')
    set_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'expires_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"

    @property
    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        try:
            instance.profile.save()
        except ObjectDoesNotExist:
            Profile.objects.create(user=instance)
