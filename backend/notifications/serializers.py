from rest_framework import serializers
from django.utils import timezone
from .models import (
    NotificationTemplate, UserNotificationPreferences, Notification,
    NotificationDelivery, BulkNotification, NotificationAnalytics
)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for notification templates"""
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'template_type', 'subject', 'body_template',
            'description', 'variables', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserNotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user notification preferences"""
    class Meta:
        model = UserNotificationPreferences
        fields = [
            'id', 'user', 'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled',
            'course_updates', 'progress_alerts', 'payment_notifications',
            'instructor_messages', 'system_announcements',
            'quiet_hours_start', 'quiet_hours_end', 'phone_number', 'timezone',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class NotificationDeliverySerializer(serializers.ModelSerializer):
    """Serializer for notification delivery tracking"""
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = NotificationDelivery
        fields = [
            'id', 'notification', 'channel', 'channel_display', 'status', 'status_display',
            'recipient_address', 'provider_message_id', 'retry_count', 'max_retries',
            'next_retry_at', 'error_message', 'error_code', 'sent_at', 'delivered_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    deliveries = NotificationDeliverySerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_id', 'recipient', 'recipient_name', 'notification_type',
            'notification_type_display', 'priority', 'priority_display', 'title', 'message',
            'rich_content', 'related_objects', 'status', 'status_display', 'sent_at',
            'delivered_at', 'read_at', 'template', 'created_by', 'created_by_name',
            'scheduled_for', 'deliveries', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'notification_id', 'recipient', 'sent_at', 'delivered_at',
            'read_at', 'created_by', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create notification with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class BulkNotificationSerializer(serializers.ModelSerializer):
    """Serializer for bulk notifications"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = BulkNotification
        fields = [
            'id', 'title', 'message', 'rich_content', 'target_filters',
            'estimated_recipients', 'scheduled_at', 'status', 'status_display',
            'total_sent', 'total_delivered', 'total_failed', 'created_by',
            'created_by_name', 'notification_type', 'notification_type_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'estimated_recipients', 'total_sent', 'total_delivered',
            'total_failed', 'created_by', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create bulk notification with current user as creator"""
        validated_data['created_by'] = self.context['request'].user

        # Calculate estimated recipients
        bulk_notification = BulkNotification(**validated_data)
        bulk_notification.estimated_recipients = bulk_notification.get_target_users().count()
        bulk_notification.save()

        return bulk_notification


class NotificationAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for notification analytics"""
    delivery_rate = serializers.ReadOnlyField()
    read_rate = serializers.ReadOnlyField()

    class Meta:
        model = NotificationAnalytics
        fields = [
            'id', 'date', 'total_sent', 'total_delivered', 'total_read', 'total_failed',
            'email_sent', 'email_delivered', 'sms_sent', 'sms_delivered',
            'push_sent', 'push_delivered', 'course_updates', 'progress_alerts',
            'payment_notifications', 'delivery_rate', 'read_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Specialized serializers for specific use cases

class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending individual notifications"""
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of user IDs to send notification to"
    )
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPES)
    title = serializers.CharField(max_length=500)
    message = serializers.CharField()
    rich_content = serializers.JSONField(required=False)
    priority = serializers.ChoiceField(choices=Notification.PRIORITY_CHOICES, default='normal')
    channels = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('email', 'Email'),
            ('sms', 'SMS'),
            ('push', 'Push'),
            ('in_app', 'In-App')
        ]),
        default=['in_app']
    )
    scheduled_for = serializers.DateTimeField(required=False)

    def validate_recipient_ids(self, value):
        """Validate that recipients exist"""
        from django.contrib.auth.models import User
        existing_ids = set(User.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
            raise serializers.ValidationError(f"Invalid user IDs: {list(invalid_ids)}")
        return value


class NotificationPreferencesUpdateSerializer(serializers.Serializer):
    """Serializer for updating notification preferences"""
    email_enabled = serializers.BooleanField(required=False)
    sms_enabled = serializers.BooleanField(required=False)
    push_enabled = serializers.BooleanField(required=False)
    in_app_enabled = serializers.BooleanField(required=False)

    course_updates = serializers.ChoiceField(
        choices=UserNotificationPreferences.FREQUENCY_CHOICES,
        required=False
    )
    progress_alerts = serializers.ChoiceField(
        choices=UserNotificationPreferences.FREQUENCY_CHOICES,
        required=False
    )
    payment_notifications = serializers.ChoiceField(
        choices=UserNotificationPreferences.FREQUENCY_CHOICES,
        required=False
    )
    instructor_messages = serializers.ChoiceField(
        choices=UserNotificationPreferences.FREQUENCY_CHOICES,
        required=False
    )
    system_announcements = serializers.ChoiceField(
        choices=UserNotificationPreferences.FREQUENCY_CHOICES,
        required=False
    )

    quiet_hours_start = serializers.TimeField(required=False, allow_null=True)
    quiet_hours_end = serializers.TimeField(required=False, allow_null=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    timezone = serializers.CharField(max_length=50, required=False)


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    total_notifications = serializers.IntegerField()
    sent_today = serializers.IntegerField()
    delivered_today = serializers.IntegerField()
    read_today = serializers.IntegerField()
    failed_today = serializers.IntegerField()
    delivery_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    read_rate = serializers.DecimalField(max_digits=5, decimal_places=2)

    # Breakdown by type
    by_type = serializers.JSONField()
    by_channel = serializers.JSONField()

    # Recent notifications
    recent_notifications = NotificationSerializer(many=True)


class CourseUpdateNotificationSerializer(serializers.Serializer):
    """Serializer for course update notifications"""
    course_id = serializers.IntegerField()
    update_type = serializers.ChoiceField(choices=[
        ('new_content', 'New Content Published'),
        ('schedule_change', 'Schedule Change'),
        ('enrollment_open', 'Enrollment Now Open'),
        ('announcement', 'Course Announcement'),
    ])
    title = serializers.CharField(max_length=500)
    message = serializers.CharField()
    additional_data = serializers.JSONField(required=False)


class ProgressMilestoneNotificationSerializer(serializers.Serializer):
    """Serializer for progress milestone notifications"""
    user_id = serializers.IntegerField()
    course_id = serializers.IntegerField()
    milestone_type = serializers.ChoiceField(choices=[
        ('completion_25', '25% Complete'),
        ('completion_50', '50% Complete'),
        ('completion_75', '75% Complete'),
        ('completion_100', 'Course Completed'),
        ('streak_7', '7-Day Streak'),
        ('streak_30', '30-Day Streak'),
    ])
    progress_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    additional_data = serializers.JSONField(required=False)


class PaymentNotificationSerializer(serializers.Serializer):
    """Serializer for payment-related notifications"""
    user_id = serializers.IntegerField()
    transaction_id = serializers.UUIDField()
    notification_type = serializers.ChoiceField(choices=[
        ('payment_successful', 'Payment Successful'),
        ('payment_failed', 'Payment Failed'),
        ('refund_processed', 'Refund Processed'),
        ('subscription_renewed', 'Subscription Renewed'),
        ('subscription_cancelled', 'Subscription Cancelled'),
    ])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    additional_data = serializers.JSONField(required=False)
