from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    NotificationTemplate, UserNotificationPreferences, Notification,
    NotificationDelivery, BulkNotification, NotificationAnalytics
)


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'template_type', 'is_active', 'created_at')
    list_filter = ('template_type', 'is_active', 'created_at')
    search_fields = ('name', 'description', 'subject')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Template Info', {
            'fields': ('name', 'template_type', 'description', 'is_active')
        }),
        ('Content', {
            'fields': ('subject', 'body_template')
        }),
        ('Variables', {
            'fields': ('variables',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserNotificationPreferences)
class UserNotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled', 'timezone')
    list_filter = ('email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled', 'timezone')
    search_fields = ('user__username', 'user__email', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Channel Preferences', {
            'fields': ('email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled')
        }),
        ('Notification Types', {
            'fields': ('course_updates', 'progress_alerts', 'payment_notifications',
                      'instructor_messages', 'system_announcements')
        }),
        ('Contact & Schedule', {
            'fields': ('phone_number', 'timezone', 'quiet_hours_start', 'quiet_hours_end')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class NotificationDeliveryInline(admin.TabularInline):
    model = NotificationDelivery
    extra = 0
    readonly_fields = ('channel', 'status', 'recipient_address', 'sent_at', 'delivered_at')
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('notification_type', 'recipient', 'title', 'priority', 'status', 'sent_at', 'read_at')
    list_filter = ('notification_type', 'priority', 'status', 'sent_at', 'created_at')
    search_fields = ('recipient__username', 'recipient__email', 'title', 'message')
    readonly_fields = ('notification_id', 'sent_at', 'delivered_at', 'read_at', 'created_at', 'updated_at')
    inlines = [NotificationDeliveryInline]

    fieldsets = (
        ('Notification Info', {
            'fields': ('notification_id', 'recipient', 'notification_type', 'priority', 'status')
        }),
        ('Content', {
            'fields': ('title', 'message', 'rich_content')
        }),
        ('Related Data', {
            'fields': ('related_objects', 'template', 'created_by', 'scheduled_for')
        }),
        ('Timestamps', {
            'fields': ('sent_at', 'delivered_at', 'read_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_as_sent', 'mark_as_delivered']

    def mark_as_sent(self, request, queryset):
        updated = queryset.filter(status='pending').update(
            status='sent',
            sent_at=timezone.now()
        )
        self.message_user(request, f'Marked {updated} notifications as sent.')
    mark_as_sent.short_description = 'Mark selected notifications as sent'

    def mark_as_delivered(self, request, queryset):
        updated = queryset.filter(status='sent').update(
            status='delivered',
            delivered_at=timezone.now()
        )
        self.message_user(request, f'Marked {updated} notifications as delivered.')
    mark_as_delivered.short_description = 'Mark selected notifications as delivered'


@admin.register(NotificationDelivery)
class NotificationDeliveryAdmin(admin.ModelAdmin):
    list_display = ('notification', 'channel', 'status', 'recipient_address', 'retry_count', 'sent_at')
    list_filter = ('channel', 'status', 'sent_at', 'created_at')
    search_fields = ('notification__title', 'recipient_address', 'error_message')
    readonly_fields = ('sent_at', 'delivered_at', 'created_at', 'updated_at')

    fieldsets = (
        ('Delivery Info', {
            'fields': ('notification', 'channel', 'status', 'recipient_address')
        }),
        ('Provider Info', {
            'fields': ('provider_message_id',)
        }),
        ('Retry Logic', {
            'fields': ('retry_count', 'max_retries', 'next_retry_at')
        }),
        ('Error Handling', {
            'fields': ('error_message', 'error_code'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('sent_at', 'delivered_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['retry_deliveries', 'mark_as_delivered']

    def retry_deliveries(self, request, queryset):
        from django.utils import timezone, timedelta
        updated = 0
        for delivery in queryset.filter(status__in=['failed', 'retry']):
            delivery.status = 'retry'
            delivery.retry_count += 1
            delivery.next_retry_at = timezone.now() + timedelta(minutes=2 ** delivery.retry_count)
            delivery.save()
            updated += 1
        self.message_user(request, f'Scheduled {updated} deliveries for retry.')
    retry_deliveries.short_description = 'Retry selected deliveries'

    def mark_as_delivered(self, request, queryset):
        updated = queryset.filter(status__in=['sent', 'retry']).update(
            status='delivered',
            delivered_at=timezone.now()
        )
        self.message_user(request, f'Marked {updated} deliveries as delivered.')
    mark_as_delivered.short_description = 'Mark selected deliveries as delivered'


@admin.register(BulkNotification)
class BulkNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'status', 'estimated_recipients', 'total_sent', 'scheduled_at')
    list_filter = ('status', 'notification_type', 'scheduled_at', 'created_at')
    search_fields = ('title', 'message', 'created_by__username')
    readonly_fields = ('estimated_recipients', 'total_sent', 'total_delivered', 'total_failed', 'created_at', 'updated_at')

    fieldsets = (
        ('Bulk Notification Info', {
            'fields': ('title', 'message', 'rich_content', 'notification_type')
        }),
        ('Targeting', {
            'fields': ('target_filters', 'estimated_recipients')
        }),
        ('Scheduling', {
            'fields': ('scheduled_at', 'status')
        }),
        ('Progress', {
            'fields': ('total_sent', 'total_delivered', 'total_failed'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['send_bulk_notifications']

    def send_bulk_notifications(self, request, queryset):
        sent = 0
        for bulk_notification in queryset.filter(status='draft'):
            bulk_notification.send_bulk_notification()
            sent += 1
        self.message_user(request, f'Sent {sent} bulk notifications.')
    send_bulk_notifications.short_description = 'Send selected bulk notifications'


@admin.register(NotificationAnalytics)
class NotificationAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_sent', 'total_delivered', 'total_read', 'delivery_rate', 'read_rate')
    list_filter = ('date',)
    readonly_fields = ('date', 'delivery_rate', 'read_rate', 'created_at', 'updated_at')

    fieldsets = (
        ('Date', {
            'fields': ('date',)
        }),
        ('Overall Metrics', {
            'fields': ('total_sent', 'total_delivered', 'total_read', 'total_failed')
        }),
        ('Channel Breakdown', {
            'fields': ('email_sent', 'email_delivered', 'sms_sent', 'sms_delivered',
                      'push_sent', 'push_delivered')
        }),
        ('Type Breakdown', {
            'fields': ('course_updates', 'progress_alerts', 'payment_notifications')
        }),
        ('Calculated Rates', {
            'fields': ('delivery_rate', 'read_rate'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
