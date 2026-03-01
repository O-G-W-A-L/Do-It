from django.db import models
from django.db.models import F
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import uuid
import json


class NotificationTemplate(models.Model):
    """
    Reusable templates for different types of notifications
    """
    TEMPLATE_TYPES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App Notification'),
    ]

    name = models.CharField(max_length=200, unique=True)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    subject = models.CharField(max_length=500, blank=True)  # For email
    body_template = models.TextField(help_text="Template with {{variable}} placeholders")

    # Template metadata
    description = models.TextField(blank=True)
    variables = models.JSONField(help_text="Available variables for this template", default=dict)

    # Status
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.template_type})"

    def render_subject(self, context=None):
        """Render subject template with context"""
        if not self.subject:
            return ""
        return self._render_template(self.subject, context or {})

    def render_body(self, context=None):
        """Render body template with context"""
        return self._render_template(self.body_template, context or {})

    def _render_template(self, template, context):
        """Simple template rendering with {{variable}} syntax"""
        result = template
        for key, value in context.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result


class UserNotificationPreferences(models.Model):
    """
    User preferences for notification delivery
    """
    FREQUENCY_CHOICES = [
        ('immediate', 'Immediate'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
        ('never', 'Never'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')

    # Channel preferences
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)

    # Category preferences with frequency
    course_updates = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='immediate')
    progress_alerts = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='immediate')
    payment_notifications = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='immediate')
    instructor_messages = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='immediate')
    system_announcements = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='immediate')

    # Quiet hours (24-hour format)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    # Contact information
    phone_number = models.CharField(max_length=20, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} notification preferences"

    def can_receive_notification(self, notification_type, channel):
        """Check if user can receive notification of given type and channel"""
        # Check if channel is enabled
        channel_enabled = getattr(self, f"{channel}_enabled", False)
        if not channel_enabled:
            return False

        # Check quiet hours for immediate notifications
        if channel in ['email', 'sms', 'push']:
            frequency = getattr(self, notification_type, 'immediate')
            if frequency == 'immediate' and self._is_quiet_hour():
                return False

        return True

    def _is_quiet_hour(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False

        now = timezone.now().time()
        if self.quiet_hours_start <= self.quiet_hours_end:
            return self.quiet_hours_start <= now <= self.quiet_hours_end
        else:
            # Quiet hours span midnight
            return now >= self.quiet_hours_start or now <= self.quiet_hours_end


class Notification(models.Model):
    """
    Individual notification instance
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    NOTIFICATION_TYPES = [
        ('course_update', 'Course Update'),
        ('progress_milestone', 'Progress Milestone'),
        ('assignment_due', 'Assignment Due'),
        ('quiz_reminder', 'Quiz Reminder'),
        ('payment_confirmation', 'Payment Confirmation'),
        ('refund_processed', 'Refund Processed'),
        ('enrollment_confirmation', 'Enrollment Confirmation'),
        ('certificate_earned', 'Certificate Earned'),
        ('instructor_message', 'Instructor Message'),
        ('system_announcement', 'System Announcement'),
        ('engagement_reminder', 'Engagement Reminder'),
    ]

    # Core notification data
    notification_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')

    # Content
    title = models.CharField(max_length=500)
    message = models.TextField()
    rich_content = models.JSONField(null=True, blank=True)  # For structured content

    # Related objects
    related_objects = models.JSONField(help_text="Links to courses, lessons, etc.", default=dict)

    # Status and delivery
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    # Template reference
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True)

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_notifications')
    scheduled_for = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['notification_type', 'status']),
            models.Index(fields=['scheduled_for']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type} to {self.recipient.username}"

    def mark_sent(self):
        """Mark notification as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save()

    def mark_delivered(self):
        """Mark notification as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()

    def mark_read(self):
        """Mark notification as read"""
        self.read_at = timezone.now()
        self.save()

    def send_email(self):
        """Send notification via email"""
        try:
            send_mail(
                subject=self.title,
                message=self.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.recipient.email],
                html_message=self.rich_content.get('html') if self.rich_content else None,
            )
            self.mark_sent()
            return True
        except Exception as e:
            self.status = 'failed'
            self.save()
            return False

    def send_sms(self):
        """Send notification via SMS (placeholder for Twilio integration)"""
        # This would integrate with Twilio or similar service
        preferences = self.recipient.notification_preferences
        if preferences.phone_number:
            # Simulate SMS sending
            print(f"SMS to {preferences.phone_number}: {self.message}")
            self.mark_sent()
            return True
        return False

    def send_push(self):
        """Send push notification (placeholder for push service integration)"""
        # This would integrate with FCM, APNs, or similar
        print(f"Push notification to {self.recipient.username}: {self.title}")
        self.mark_sent()
        return True


class NotificationDelivery(models.Model):
    """
    Track delivery attempts and status for each channel
    """
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('retry', 'Retry Scheduled'),
    ]

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Delivery details
    recipient_address = models.CharField(max_length=500)  # email, phone, device token
    provider_message_id = models.CharField(max_length=255, blank=True)  # External provider ID

    # Retry logic
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    next_retry_at = models.DateTimeField(null=True, blank=True)

    # Error tracking
    error_message = models.TextField(blank=True)
    error_code = models.CharField(max_length=100, blank=True)

    # Timestamps
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['notification', 'channel']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification} via {self.channel}"

    def mark_sent(self, provider_message_id=None):
        """Mark delivery as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        if provider_message_id:
            self.provider_message_id = provider_message_id
        self.save()

    def mark_delivered(self):
        """Mark delivery as delivered"""
        self.status = 'delivered'
        self.delivered_at = timezone.now()
        self.save()

    def mark_failed(self, error_message=None, error_code=None):
        """Mark delivery as failed"""
        # Use F() for atomic counter update - prevents race conditions
        NotificationDelivery.objects.filter(pk=self.pk).update(
            retry_count=F('retry_count') + 1
        )
        self.refresh_from_db()
        
        self.status = 'failed'
        self.error_message = error_message or ''
        self.error_code = error_code or ''

        if self.retry_count < self.max_retries:
            # Schedule retry (exponential backoff)
            from datetime import timedelta
            delay = timedelta(minutes=2 ** self.retry_count)
            self.next_retry_at = timezone.now() + delay
            self.status = 'retry'
        else:
            # Max retries reached
            self.status = 'failed'

        self.save()

    def should_retry(self):
        """Check if delivery should be retried"""
        return (
            self.status == 'retry' and
            self.retry_count < self.max_retries and
            (self.next_retry_at is None or timezone.now() >= self.next_retry_at)
        )


class BulkNotification(models.Model):
    """
    Bulk notifications sent to multiple users
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=500)
    message = models.TextField()
    rich_content = models.JSONField(null=True, blank=True)

    # Targeting
    target_filters = models.JSONField(help_text="Filters for target audience", default=dict)
    estimated_recipients = models.PositiveIntegerField(default=0)

    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Progress tracking
    total_sent = models.PositiveIntegerField(default=0)
    total_delivered = models.PositiveIntegerField(default=0)
    total_failed = models.PositiveIntegerField(default=0)

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bulk_notifications')
    notification_type = models.CharField(max_length=50, choices=Notification.NOTIFICATION_TYPES, default='system_announcement')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Bulk: {self.title}"

    def get_target_users(self):
        """Get users matching the target filters"""
        from users.models import Profile

        queryset = User.objects.filter(is_active=True)

        filters = self.target_filters

        # Apply role filters
        if 'roles' in filters:
            roles = filters['roles']
            if 'student' in roles:
                queryset = queryset.filter(profile__is_student=True)
            if 'instructor' in roles:
                queryset = queryset.filter(profile__is_instructor=True)
            if 'admin' in roles:
                queryset = queryset.filter(profile__is_admin=True)

        # Apply course filters
        if 'courses' in filters:
            course_ids = filters['courses']
            from courses.models import Enrollment
            enrolled_users = Enrollment.objects.filter(
                course_id__in=course_ids,
                status__in=['active', 'completed']
            ).values_list('student', flat=True)
            queryset = queryset.filter(id__in=enrolled_users)

        return queryset.distinct()

    def send_bulk_notification(self):
        """Send notification to all target users"""
        self.status = 'sending'
        self.save()

        target_users = self.get_target_users()

        for user in target_users:
            # Create individual notification
            notification = Notification.objects.create(
                recipient=user,
                notification_type=self.notification_type,
                title=self.title,
                message=self.message,
                rich_content=self.rich_content,
                created_by=self.created_by,
            )

            # Queue for delivery (this would be handled by a task queue in production)
            notification.mark_sent()
            self.total_sent += 1

        self.status = 'completed'
        self.save()


class NotificationAnalytics(models.Model):
    """
    Analytics for notification performance
    """
    date = models.DateField(unique=True)

    # Overall metrics
    total_sent = models.PositiveIntegerField(default=0)
    total_delivered = models.PositiveIntegerField(default=0)
    total_read = models.PositiveIntegerField(default=0)
    total_failed = models.PositiveIntegerField(default=0)

    # Channel breakdown
    email_sent = models.PositiveIntegerField(default=0)
    email_delivered = models.PositiveIntegerField(default=0)
    sms_sent = models.PositiveIntegerField(default=0)
    sms_delivered = models.PositiveIntegerField(default=0)
    push_sent = models.PositiveIntegerField(default=0)
    push_delivered = models.PositiveIntegerField(default=0)

    # Type breakdown
    course_updates = models.PositiveIntegerField(default=0)
    progress_alerts = models.PositiveIntegerField(default=0)
    payment_notifications = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Notification analytics for {self.date}"

    @property
    def delivery_rate(self):
        """Calculate overall delivery rate"""
        if self.total_sent == 0:
            return 0
        return (self.total_delivered / self.total_sent) * 100

    @property
    def read_rate(self):
        """Calculate read rate"""
        if self.total_delivered == 0:
            return 0
        return (self.total_read / self.total_delivered) * 100
