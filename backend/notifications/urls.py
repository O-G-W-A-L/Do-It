from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationTemplateViewSet, UserNotificationPreferencesViewSet,
    NotificationViewSet, NotificationDeliveryViewSet, BulkNotificationViewSet,
    NotificationAnalyticsViewSet, send_notification, notification_stats,
    trigger_course_update_notification, trigger_progress_milestone_notification,
    trigger_payment_notification, process_notification_deliveries
)

router = DefaultRouter()
router.register(r'templates', NotificationTemplateViewSet)
router.register(r'preferences', UserNotificationPreferencesViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'deliveries', NotificationDeliveryViewSet)
router.register(r'bulk', BulkNotificationViewSet)
router.register(r'analytics', NotificationAnalyticsViewSet)

urlpatterns = [
    # ViewSet endpoints
    path('', include(router.urls)),

    # Custom endpoints
    path('send/', send_notification, name='send-notification'),
    path('stats/', notification_stats, name='notification-stats'),

    # Trigger endpoints (for internal use by other apps)
    path('trigger/course-update/', trigger_course_update_notification, name='trigger-course-update'),
    path('trigger/progress-milestone/', trigger_progress_milestone_notification, name='trigger-progress-milestone'),
    path('trigger/payment/', trigger_payment_notification, name='trigger-payment'),

    # Processing endpoint (for task queue)
    path('process-deliveries/', process_notification_deliveries, name='process-deliveries'),
]
