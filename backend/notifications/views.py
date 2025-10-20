from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import (
    NotificationTemplate, UserNotificationPreferences, Notification,
    NotificationDelivery, BulkNotification, NotificationAnalytics
)
from .serializers import (
    NotificationTemplateSerializer, UserNotificationPreferencesSerializer,
    NotificationSerializer, NotificationDeliverySerializer, BulkNotificationSerializer,
    NotificationAnalyticsSerializer, SendNotificationSerializer,
    NotificationPreferencesUpdateSerializer, NotificationStatsSerializer,
    CourseUpdateNotificationSerializer, ProgressMilestoneNotificationSerializer,
    PaymentNotificationSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification templates (admin/instructor only)
    """
    queryset = NotificationTemplate.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationTemplateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.profile.is_admin:
            return NotificationTemplate.objects.all()
        elif user.profile.is_instructor:
            # Instructors can see templates but not modify system ones
            return NotificationTemplate.objects.filter(is_active=True)
        else:
            return NotificationTemplate.objects.none()


class UserNotificationPreferencesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user notification preferences
    """
    queryset = UserNotificationPreferences.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UserNotificationPreferencesSerializer

    def get_queryset(self):
        return UserNotificationPreferences.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create preferences for current user"""
        obj, created = UserNotificationPreferences.objects.get_or_create(
            user=self.request.user,
            defaults={
                'phone_number': '',
                'timezone': 'UTC'
            }
        )
        return obj

    @action(detail=False, methods=['patch'])
    def update_preferences(self, request):
        """Update notification preferences"""
        preferences = self.get_object()
        serializer = NotificationPreferencesUpdateSerializer(data=request.data)
        if serializer.is_valid():
            for field, value in serializer.validated_data.items():
                setattr(preferences, field, value)
            preferences.save()
            return Response(UserNotificationPreferencesSerializer(preferences).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notifications
    """
    queryset = Notification.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            if is_read.lower() == 'true':
                queryset = queryset.filter(read_at__isnull=False)
            else:
                queryset = queryset.filter(read_at__isnull=True)

        return queryset

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all user's notifications as read"""
        Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True
        ).update(read_at=timezone.now())

        return Response({'detail': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True
        ).count()

        return Response({'unread_count': count})


class NotificationDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for notification delivery tracking (admin only)
    """
    queryset = NotificationDelivery.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationDeliverySerializer

    def get_queryset(self):
        if not self.request.user.profile.is_admin:
            return NotificationDelivery.objects.none()

        queryset = NotificationDelivery.objects.all()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by channel
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)

        return queryset


class BulkNotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for bulk notifications (admin/instructor only)
    """
    queryset = BulkNotification.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = BulkNotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.profile.is_admin:
            return BulkNotification.objects.all()
        elif user.profile.is_instructor:
            return BulkNotification.objects.filter(created_by=user)
        else:
            return BulkNotification.objects.none()

    @action(detail=True, methods=['post'])
    def send_now(self, request, pk=None):
        """Send bulk notification immediately"""
        bulk_notification = self.get_object()

        if bulk_notification.status != 'draft':
            return Response({'detail': 'Notification has already been sent'}, status=status.HTTP_400_BAD_REQUEST)

        bulk_notification.send_bulk_notification()
        serializer = self.get_serializer(bulk_notification)
        return Response(serializer.data)


class NotificationAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for notification analytics (admin only)
    """
    queryset = NotificationAnalytics.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationAnalyticsSerializer

    def get_queryset(self):
        if not self.request.user.profile.is_admin:
            return NotificationAnalytics.objects.none()
        return NotificationAnalytics.objects.all()


def _get_recipient_address(user, channel):
    """Helper function to get recipient address for channel"""
    if channel == 'email':
        return user.email
    elif channel == 'sms':
        preferences = user.notification_preferences
        return preferences.phone_number or ''
    elif channel == 'push':
        # This would be device token in production
        return f"device_token_{user.id}"
    elif channel == 'in_app':
        return f"user_{user.id}"
    return ''


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):
    """Send notification to multiple users"""
    serializer = SendNotificationSerializer(data=request.data)
    if serializer.is_valid():
        recipient_ids = serializer.validated_data['recipient_ids']
        notification_type = serializer.validated_data['notification_type']
        title = serializer.validated_data['title']
        message = serializer.validated_data['message']
        rich_content = serializer.validated_data.get('rich_content')
        priority = serializer.validated_data.get('priority', 'normal')
        channels = serializer.validated_data.get('channels', ['in_app'])
        scheduled_for = serializer.validated_data.get('scheduled_for')

        from django.contrib.auth.models import User
        recipients = User.objects.filter(id__in=recipient_ids)

        notifications_created = 0

        for recipient in recipients:
            # Check user preferences for each channel
            preferences = recipient.notification_preferences
            allowed_channels = []

            for channel in channels:
                if preferences.can_receive_notification(notification_type, channel):
                    allowed_channels.append(channel)

            if allowed_channels:  # Only create if at least one channel is allowed
                notification = Notification.objects.create(
                    recipient=recipient,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    rich_content=rich_content,
                    priority=priority,
                    created_by=request.user,
                    scheduled_for=scheduled_for,
                )

                # Create delivery records for allowed channels
                for channel in allowed_channels:
                    recipient_address = _get_recipient_address(recipient, channel)
                    NotificationDelivery.objects.create(
                        notification=notification,
                        channel=channel,
                        recipient_address=recipient_address,
                    )

                notifications_created += 1

        return Response({
            'detail': f'Notifications queued for {notifications_created} users',
            'total_recipients': len(recipient_ids)
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """Get notification statistics for current user"""
    user = request.user

    # Get today's date
    today = timezone.now().date()

    # Basic stats
    total_notifications = Notification.objects.filter(recipient=user).count()
    sent_today = Notification.objects.filter(
        recipient=user,
        sent_at__date=today
    ).count()
    delivered_today = Notification.objects.filter(
        recipient=user,
        delivered_at__date=today
    ).count()
    read_today = Notification.objects.filter(
        recipient=user,
        read_at__date=today
    ).count()
    failed_today = Notification.objects.filter(
        recipient=user,
        status='failed',
        created_at__date=today
    ).count()

    # Calculate rates
    delivery_rate = (delivered_today / sent_today * 100) if sent_today > 0 else 0
    read_rate = (read_today / delivered_today * 100) if delivered_today > 0 else 0

    # Breakdown by type
    by_type = Notification.objects.filter(
        recipient=user,
        created_at__date=today
    ).values('notification_type').annotate(
        count=Count('id')
    ).order_by('-count')

    # Breakdown by channel (from deliveries)
    by_channel = NotificationDelivery.objects.filter(
        notification__recipient=user,
        created_at__date=today
    ).values('channel').annotate(
        count=Count('id')
    ).order_by('-count')

    # Recent notifications
    recent_notifications = Notification.objects.filter(
        recipient=user
    ).order_by('-created_at')[:10]

    stats_data = {
        'total_notifications': total_notifications,
        'sent_today': sent_today,
        'delivered_today': delivered_today,
        'read_today': read_today,
        'failed_today': failed_today,
        'delivery_rate': round(delivery_rate, 2),
        'read_rate': round(read_rate, 2),
        'by_type': list(by_type),
        'by_channel': list(by_channel),
        'recent_notifications': recent_notifications
    }

    serializer = NotificationStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_course_update_notification(request):
    """Trigger course update notification (instructor/admin only)"""
    user = request.user
    if not (user.profile.is_instructor or user.profile.is_admin):
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CourseUpdateNotificationSerializer(data=request.data)
    if serializer.is_valid():
        course_id = serializer.validated_data['course_id']
        update_type = serializer.validated_data['update_type']
        title = serializer.validated_data['title']
        message = serializer.validated_data['message']
        additional_data = serializer.validated_data.get('additional_data', {})

        # Get enrolled students
        from courses.models import Enrollment
        enrolled_students = Enrollment.objects.filter(
            course_id=course_id,
            status__in=['active', 'completed']
        ).values_list('student', flat=True)

        # Create notifications for enrolled students
        notifications_created = 0
        for student_id in enrolled_students:
            notification = Notification.objects.create(
                recipient_id=student_id,
                notification_type='course_update',
                title=title,
                message=message,
                related_objects={
                    'course_id': course_id,
                    'update_type': update_type,
                    **additional_data
                },
                created_by=user,
            )

            # Create in-app delivery
            NotificationDelivery.objects.create(
                notification=notification,
                channel='in_app',
                recipient_address=f"user_{student_id}",
            )

            notifications_created += 1

        return Response({
            'detail': f'Course update notifications sent to {notifications_created} students',
            'course_id': course_id,
            'update_type': update_type
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow from internal services
def trigger_progress_milestone_notification(request):
    """Trigger progress milestone notification"""
    serializer = ProgressMilestoneNotificationSerializer(data=request.data)
    if serializer.is_valid():
        user_id = serializer.validated_data['user_id']
        course_id = serializer.validated_data['course_id']
        milestone_type = serializer.validated_data['milestone_type']
        progress_percentage = serializer.validated_data['progress_percentage']
        additional_data = serializer.validated_data.get('additional_data', {})

        # Create milestone notification
        notification = Notification.objects.create(
            recipient_id=user_id,
            notification_type='progress_milestone',
            title=f"Progress Milestone: {milestone_type.replace('_', ' ').title()}",
            message=f"Congratulations! You've reached {progress_percentage}% completion in your course.",
            related_objects={
                'course_id': course_id,
                'milestone_type': milestone_type,
                'progress_percentage': float(progress_percentage),
                **additional_data
            },
        )

        # Create deliveries based on user preferences
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id)
        preferences = user.notification_preferences

        channels = []
        if preferences.can_receive_notification('progress_alerts', 'in_app'):
            channels.append('in_app')
        if preferences.can_receive_notification('progress_alerts', 'email'):
            channels.append('email')
        if preferences.can_receive_notification('progress_alerts', 'push'):
            channels.append('push')

        for channel in channels:
            recipient_address = _get_recipient_address(user, channel)
            NotificationDelivery.objects.create(
                notification=notification,
                channel=channel,
                recipient_address=recipient_address,
            )

        return Response({
            'detail': 'Progress milestone notification created',
            'user_id': user_id,
            'milestone_type': milestone_type
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow from internal services
def trigger_payment_notification(request):
    """Trigger payment-related notification"""
    serializer = PaymentNotificationSerializer(data=request.data)
    if serializer.is_valid():
        user_id = serializer.validated_data['user_id']
        transaction_id = serializer.validated_data['transaction_id']
        notification_type = serializer.validated_data['notification_type']
        amount = serializer.validated_data['amount']
        currency = serializer.validated_data['currency']
        additional_data = serializer.validated_data.get('additional_data', {})

        # Create payment notification
        title_map = {
            'payment_successful': 'Payment Successful',
            'payment_failed': 'Payment Failed',
            'refund_processed': 'Refund Processed',
            'subscription_renewed': 'Subscription Renewed',
            'subscription_cancelled': 'Subscription Cancelled',
        }

        message_map = {
            'payment_successful': f'Your payment of {amount} {currency} has been processed successfully.',
            'payment_failed': f'Your payment of {amount} {currency} could not be processed.',
            'refund_processed': f'A refund of {amount} {currency} has been processed.',
            'subscription_renewed': f'Your subscription has been renewed for {amount} {currency}.',
            'subscription_cancelled': f'Your subscription has been cancelled.',
        }

        notification = Notification.objects.create(
            recipient_id=user_id,
            notification_type='payment_confirmation',
            title=title_map.get(notification_type, 'Payment Notification'),
            message=message_map.get(notification_type, f'Payment notification: {notification_type}'),
            related_objects={
                'transaction_id': str(transaction_id),
                'amount': float(amount),
                'currency': currency,
                **additional_data
            },
        )

        # Create deliveries based on user preferences
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id)
        preferences = user.notification_preferences

        channels = []
        if preferences.can_receive_notification('payment_notifications', 'in_app'):
            channels.append('in_app')
        if preferences.can_receive_notification('payment_notifications', 'email'):
            channels.append('email')
        if preferences.can_receive_notification('payment_notifications', 'sms'):
            channels.append('sms')

        for channel in channels:
            recipient_address = _get_recipient_address(user, channel)
            NotificationDelivery.objects.create(
                notification=notification,
                channel=channel,
                recipient_address=recipient_address,
            )

        return Response({
            'detail': 'Payment notification created',
            'user_id': user_id,
            'notification_type': notification_type
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _get_recipient_address(user, channel):
    """Helper function to get recipient address for channel"""
    if channel == 'email':
        return user.email
    elif channel == 'sms':
        preferences = user.notification_preferences
        return preferences.phone_number or ''
    elif channel == 'push':
        # This would be device token in production
        return f"device_token_{user.id}"
    elif channel == 'in_app':
        return f"user_{user.id}"
    return ''


@api_view(['POST'])
@permission_classes([AllowAny])
def process_notification_deliveries(request):
    """Process pending notification deliveries (would be called by task queue)"""
    # Get deliveries that need to be sent
    pending_deliveries = NotificationDelivery.objects.filter(
        status__in=['pending', 'retry'],
        next_retry_at__isnull=True
    ) | NotificationDelivery.objects.filter(
        status='retry',
        next_retry_at__lte=timezone.now()
    )

    processed = 0
    for delivery in pending_deliveries[:50]:  # Process in batches
        try:
            if delivery.channel == 'email':
                success = delivery.notification.send_email()
            elif delivery.channel == 'sms':
                success = delivery.notification.send_sms()
            elif delivery.channel == 'push':
                success = delivery.notification.send_push()
            elif delivery.channel == 'in_app':
                # In-app notifications are always "delivered" immediately
                delivery.mark_delivered()
                success = True
            else:
                success = False

            if success:
                processed += 1

        except Exception as e:
            delivery.mark_failed(str(e))
            continue

    return Response({
        'detail': f'Processed {processed} notification deliveries',
        'remaining': pending_deliveries.count() - processed
    })
