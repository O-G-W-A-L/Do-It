from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg, F, Value
from django.db.models.functions import TruncDate, TruncHour, TruncDay, TruncWeek, TruncMonth
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from datetime import timedelta
import json

from .models import (
    AnalyticsEvent, AnalyticsMetric, AnalyticsReport, AnalyticsDashboard,
    LearningRecommendation, PredictiveInsight, DataExport
)
from .serializers import (
    AnalyticsEventSerializer, AnalyticsMetricSerializer, AnalyticsReportSerializer,
    AnalyticsDashboardSerializer, LearningRecommendationSerializer,
    PredictiveInsightSerializer, DataExportSerializer, TrackEventSerializer,
    MetricsQuerySerializer, DashboardStatsSerializer, UserEngagementSerializer,
    CoursePerformanceSerializer, RevenueAnalyticsSerializer, LearningPathSerializer,
    PredictiveAnalyticsSerializer, ReportGenerationSerializer,
    BulkMetricsCalculationSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AnalyticsEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analytics events
    """
    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AnalyticsEvent.objects.all()

        # Filter by user (unless admin)
        if not user.profile.is_admin:
            queryset = queryset.filter(user=user)

        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)

        return queryset.order_by('-timestamp')


class AnalyticsMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for analytics metrics (read-only)
    """
    queryset = AnalyticsMetric.objects.all()
    serializer_class = AnalyticsMetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AnalyticsMetric.objects.all()

        # Filter by metric type
        metric_type = self.request.query_params.get('metric_type')
        if metric_type:
            queryset = queryset.filter(metric_type=metric_type)

        # Filter by aggregation period
        period = self.request.query_params.get('period')
        if period:
            queryset = queryset.filter(aggregation_period=period)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(period_start__gte=start_date)
        if end_date:
            queryset = queryset.filter(period_end__lte=end_date)

        return queryset.order_by('-period_start')


class AnalyticsReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analytics reports
    """
    queryset = AnalyticsReport.objects.all()
    serializer_class = AnalyticsReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AnalyticsReport.objects.all()

        # Filter by user access
        if not user.profile.is_admin:
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(is_public=True) |
                Q(allowed_users=user)
            )

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate a report"""
        report = self.get_object()

        if not report.can_access(request.user):
            return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            file_path = report.generate_report()
            serializer = self.get_serializer(report)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download report file"""
        report = self.get_object()

        if not report.can_access(request.user):
            raise Http404("Report not found")

        if not report.file_path:
            raise Http404("Report file not available")

        try:
            file_obj = default_storage.open(report.file_path)
            response = HttpResponse(file_obj, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{report.title}.csv"'
            return response
        except Exception:
            raise Http404("File not found")


class AnalyticsDashboardViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analytics dashboards
    """
    queryset = AnalyticsDashboard.objects.all()
    serializer_class = AnalyticsDashboardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AnalyticsDashboard.objects.all()

        # Filter by user access
        if not user.profile.is_admin:
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(is_public=True)
            )

        return queryset.order_by('-created_at')

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """Record dashboard view"""
        dashboard = self.get_object()
        dashboard.record_view()
        return Response({'detail': 'View recorded'})


class LearningRecommendationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for learning recommendations
    """
    queryset = LearningRecommendation.objects.all()
    serializer_class = LearningRecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = LearningRecommendation.objects.filter(user=user, is_active=True)

        # Filter by type
        rec_type = self.request.query_params.get('type')
        if rec_type:
            queryset = queryset.filter(recommendation_type=rec_type)

        # Filter by viewed status
        viewed = self.request.query_params.get('viewed')
        if viewed is not None:
            if viewed.lower() == 'true':
                queryset = queryset.filter(is_viewed=True)
            else:
                queryset = queryset.filter(is_viewed=False)

        return queryset.order_by('-priority', '-created_at')

    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        """Mark recommendation as viewed"""
        recommendation = self.get_object()
        recommendation.mark_viewed()
        serializer = self.get_serializer(recommendation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss recommendation"""
        recommendation = self.get_object()
        recommendation.mark_dismissed()
        serializer = self.get_serializer(recommendation)
        return Response(serializer.data)


class PredictiveInsightViewSet(viewsets.ModelViewSet):
    """
    ViewSet for predictive insights
    """
    queryset = PredictiveInsight.objects.all()
    serializer_class = PredictiveInsightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = PredictiveInsight.objects.filter(is_active=True)

        # Filter by user access (admins see all, others see only their insights)
        if not user.profile.is_admin:
            queryset = queryset.filter(
                Q(related_user=user) |
                Q(related_user__isnull=True)
            )

        # Filter by type
        insight_type = self.request.query_params.get('type')
        if insight_type:
            queryset = queryset.filter(insight_type=insight_type)

        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)

        return queryset.order_by('-severity', '-created_at')

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an insight"""
        insight = self.get_object()
        insight.resolve(request.user)
        serializer = self.get_serializer(insight)
        return Response(serializer.data)


class DataExportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for data exports
    """
    queryset = DataExport.objects.all()
    serializer_class = DataExportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = DataExport.objects.all()

        # Filter by user access
        if not user.profile.is_admin:
            queryset = queryset.filter(requested_by=user)

        return queryset.order_by('-requested_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve data export (admin only)"""
        if not request.user.profile.is_admin:
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        export = self.get_object()
        export.approve(request.user)
        serializer = self.get_serializer(export)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download export file"""
        export = self.get_object()

        # Check access
        if export.requested_by != request.user and not request.user.profile.is_admin:
            raise Http404("Export not found")

        if export.status != 'completed' or not export.file_path:
            raise Http404("Export not available")

        try:
            file_obj = default_storage.open(export.file_path)
            response = HttpResponse(file_obj, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{export.title}.{export.file_format}"'
            return response
        except Exception:
            raise Http404("File not found")


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow from internal services
def track_event(request):
    """Track an analytics event"""
    serializer = TrackEventSerializer(data=request.data)
    if serializer.is_valid():
        event_data = serializer.validated_data.copy()

        # Add user from request if authenticated
        if request.user.is_authenticated:
            event_data['user'] = request.user

        # Add IP address
        event_data['ip_address'] = request.META.get('REMOTE_ADDR')

        # Add user agent
        event_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')

        event = AnalyticsEvent.track_event(**event_data)
        return Response({
            'event_id': event.event_id,
            'tracked': True
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    user = request.user

    # Basic stats
    total_users = User.objects.count()
    active_users_today = AnalyticsEvent.objects.filter(
        timestamp__date=timezone.now().date(),
        event_type__in=['user_login', 'course_view', 'lesson_start']
    ).values('user').distinct().count()

    # Course stats
    from courses.models import Course, Enrollment
    total_courses = Course.objects.count()
    total_enrollments = Enrollment.objects.count()

    # Completion rate
    completed_enrollments = Enrollment.objects.filter(status='completed').count()
    course_completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0

    # Revenue stats
    from payments.models import PaymentTransaction
    total_revenue = PaymentTransaction.objects.filter(
        status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Average session duration
    avg_session = AnalyticsEvent.objects.filter(
        event_type='user_login',
        duration__isnull=False
    ).aggregate(avg=Avg('duration'))['avg']
    average_session_duration = avg_session or timedelta(seconds=0)

    # Top courses
    top_courses = Enrollment.objects.values('course__title').annotate(
        enrollments=Count('id')
    ).order_by('-enrollments')[:5]

    # Recent activity
    recent_activity = AnalyticsEvent.objects.select_related('user').order_by('-timestamp')[:10]
    recent_activity_data = []
    for event in recent_activity:
        recent_activity_data.append({
            'event_type': event.get_event_type_display(),
            'user': event.user.get_full_name() if event.user else 'Anonymous',
            'timestamp': event.timestamp,
            'details': event.event_data.get('description', '')
        })

    stats_data = {
        'total_users': total_users,
        'active_users_today': active_users_today,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'course_completion_rate': round(course_completion_rate, 2),
        'total_revenue': float(total_revenue),
        'average_session_duration': average_session_duration,
        'top_courses': list(top_courses),
        'recent_activity': recent_activity_data
    }

    serializer = DashboardStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_engagement(request, user_id=None):
    """Get user engagement analytics"""
    target_user_id = user_id or request.user.id

    # Check permissions
    if target_user_id != request.user.id and not request.user.profile.is_admin:
        return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, id=target_user_id)

    # Calculate engagement metrics
    total_sessions = AnalyticsEvent.objects.filter(
        user=user,
        event_type='user_login'
    ).count()

    # Time spent (sum of session durations)
    time_spent_agg = AnalyticsEvent.objects.filter(
        user=user,
        duration__isnull=False
    ).aggregate(total=Sum('duration'))
    total_time_spent = time_spent_agg['total'] or timedelta(seconds=0)

    # Course engagement
    from courses.models import Enrollment
    courses_enrolled = Enrollment.objects.filter(student=user).count()
    courses_completed = Enrollment.objects.filter(student=user, status='completed').count()
    completion_rate = (courses_completed / courses_enrolled * 100) if courses_enrolled > 0 else 0

    # Quiz performance
    from progress.models import QuizSubmission
    quiz_scores = QuizSubmission.objects.filter(student=user).aggregate(avg=Avg('percentage'))
    average_quiz_score = quiz_scores['avg'] or 0

    # Last activity
    last_activity = AnalyticsEvent.objects.filter(user=user).order_by('-timestamp').first()
    last_activity_time = last_activity.timestamp if last_activity else None

    # Engagement score (simplified calculation)
    engagement_score = min(100, (
        (total_sessions * 5) +
        (courses_completed * 10) +
        (completion_rate * 0.5) +
        (average_quiz_score * 0.2)
    ) / 100 * 100)

    engagement_data = {
        'user_id': user.id,
        'total_sessions': total_sessions,
        'total_time_spent': total_time_spent,
        'courses_enrolled': courses_enrolled,
        'courses_completed': courses_completed,
        'completion_rate': round(completion_rate, 2),
        'average_quiz_score': round(average_quiz_score, 2),
        'last_activity': last_activity_time,
        'engagement_score': round(engagement_score, 2)
    }

    serializer = UserEngagementSerializer(engagement_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_performance(request, course_id):
    """Get course performance analytics"""
    from courses.models import Course, Enrollment, Lesson
    from progress.models import QuizAttempt

    course = get_object_or_404(Course, id=course_id)

    # Check permissions
    if course.instructor != request.user and not request.user.profile.is_admin:
        return Response({'detail': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    # Basic metrics
    total_enrollments = Enrollment.objects.filter(course=course).count()
    total_completions = Enrollment.objects.filter(course=course, status='completed').count()
    completion_rate = (total_completions / total_enrollments * 100) if total_enrollments > 0 else 0

    # Average completion time
    completed_enrollments = Enrollment.objects.filter(
        course=course,
        status='completed',
        completed_at__isnull=False
    )
    avg_completion_time = timedelta(seconds=0)
    if completed_enrollments.exists():
        time_agg = completed_enrollments.aggregate(avg=Avg(F('completed_at') - F('enrolled_at')))
        if time_agg['avg']:
            avg_completion_time = time_agg['avg']

    # Average rating (placeholder)
    average_rating = 4.5  # Would come from a rating system

    # Drop-off points (simplified)
    total_lessons = Lesson.objects.filter(course=course).count()
    drop_off_points = []

    for i in range(1, min(total_lessons + 1, 10)):
        completed_up_to = Enrollment.objects.filter(
            course=course,
            progress_percentage__gte=(i / total_lessons * 100)
        ).count()
        drop_off_rate = ((total_enrollments - completed_up_to) / total_enrollments * 100) if total_enrollments > 0 else 0
        drop_off_points.append({
            'lesson_number': i,
            'drop_off_rate': round(drop_off_rate, 2)
        })

    # Quiz performance
    quiz_performance = QuizSubmission.objects.filter(
        lesson__course=course
    ).values('lesson__title').annotate(
        attempts=Count('id'),
        avg_score=Avg('percentage'),
        pass_rate=Sum('passed') / Count('id') * 100
    ).order_by('-attempts')[:5]

    performance_data = {
        'course_id': course.id,
        'course_title': course.title,
        'total_enrollments': total_enrollments,
        'total_completions': total_completions,
        'completion_rate': round(completion_rate, 2),
        'average_completion_time': avg_completion_time,
        'average_rating': average_rating,
        'drop_off_points': drop_off_points,
        'quiz_performance': list(quiz_performance)
    }

    serializer = CoursePerformanceSerializer(performance_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_analytics(request):
    """Get revenue analytics"""
    if not request.user.profile.is_admin:
        return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    from payments.models import PaymentTransaction, SubscriptionPlan

    # Total revenue
    total_revenue_agg = PaymentTransaction.objects.filter(
        status='completed'
    ).aggregate(total=Sum('amount'))
    total_revenue = total_revenue_agg['total'] or 0

    # Monthly revenue (last 12 months)
    monthly_revenue = []
    for i in range(11, -1, -1):
        month_start = timezone.now().replace(day=1) - timedelta(days=i*30)
        month_end = month_start.replace(day=28) + timedelta(days=4)  # End of month
        month_end = month_end - timedelta(days=month_end.day)

        revenue = PaymentTransaction.objects.filter(
            status='completed',
            created_at__gte=month_start,
            created_at__lte=month_end
        ).aggregate(total=Sum('amount'))['total'] or 0

        monthly_revenue.append({
            'month': month_start.strftime('%Y-%m'),
            'revenue': float(revenue)
        })

    # Revenue by course
    revenue_by_course = PaymentTransaction.objects.filter(
        status='completed',
        payment_type='course_purchase'
    ).values('related_objects__course_id').annotate(
        revenue=Sum('amount')
    ).order_by('-revenue')[:10]

    # Revenue by subscription
    revenue_by_subscription = PaymentTransaction.objects.filter(
        status='completed',
        payment_type='subscription'
    ).values('related_objects__plan_id').annotate(
        revenue=Sum('amount')
    ).order_by('-revenue')[:10]

    # Average transaction value
    avg_transaction = PaymentTransaction.objects.filter(
        status='completed'
    ).aggregate(avg=Avg('amount'))['avg'] or 0

    # Conversion rate (simplified)
    total_attempts = PaymentTransaction.objects.count()
    successful_payments = PaymentTransaction.objects.filter(status='completed').count()
    conversion_rate = (successful_payments / total_attempts * 100) if total_attempts > 0 else 0

    revenue_data = {
        'total_revenue': float(total_revenue),
        'monthly_revenue': monthly_revenue,
        'revenue_by_course': list(revenue_by_course),
        'revenue_by_subscription': list(revenue_by_subscription),
        'average_transaction_value': round(float(avg_transaction), 2),
        'conversion_rate': round(conversion_rate, 2)
    }

    serializer = RevenueAnalyticsSerializer(revenue_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def learning_recommendations(request):
    """Get personalized learning recommendations for user"""
    user = request.user

    # Get user's current skills and progress
    from courses.models import Enrollment

    # Current enrollments
    current_courses = Enrollment.objects.filter(
        student=user,
        status__in=['active', 'completed']
    ).values_list('course', flat=True)

    # Completed courses
    completed_courses = Enrollment.objects.filter(
        student=user,
        status='completed'
    ).values_list('course', flat=True)

    # Skills learned (simplified)
    current_skills = ['Python', 'JavaScript']  # Would come from progress tracking

    # Recommended courses (simplified logic)
    from courses.models import Course
    recommended_course_ids = Course.objects.exclude(
        id__in=current_courses
    ).annotate(
        enrollment_count=Count('enrollments')
    ).order_by('-enrollment_count').values_list('id', flat=True)[:3]

    recommended_courses = Course.objects.filter(id__in=recommended_course_ids)

    recommendations = []
    for course in recommended_courses:
        recommendations.append({
            'id': course.id,
            'title': course.title,
            'description': course.description[:100] + '...',
            'difficulty': course.level,
            'estimated_hours': course.duration_weeks
        })

    # Skill gaps (simplified)
    skill_gaps = [
        {'skill': 'Data Structures', 'gap_level': 'high'},
        {'skill': 'Algorithms', 'gap_level': 'medium'}
    ]

    # Estimated completion time
    estimated_completion_time = timedelta(hours=200)  # Based on recommendations

    recommendation_data = {
        'user_id': user.id,
        'current_skills': current_skills,
        'recommended_courses': recommendations,
        'skill_gaps': skill_gaps,
        'estimated_completion_time': estimated_completion_time,
        'confidence_score': 0.75
    }

    serializer = LearningPathSerializer(recommendation_data)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_metrics(request):
    """Calculate analytics metrics"""
    serializer = BulkMetricsCalculationSerializer(data=request.data)
    if serializer.is_valid():
        metric_types = serializer.validated_data['metric_types']
        aggregation_period = serializer.validated_data['aggregation_period']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        filters = serializer.validated_data['filters']

        calculated_metrics = []

        for metric_type in metric_types:
            # Calculate metric based on type
            value = calculate_metric_value(metric_type, start_date, end_date, filters)

            if value is not None:
                metric = AnalyticsMetric.objects.create(
                    metric_type=metric_type,
                    aggregation_period=aggregation_period,
                    period_start=start_date,
                    period_end=end_date,
                    value=value,
                    filters=filters
                )
                calculated_metrics.append(metric)

        return Response({
            'calculated_metrics': len(calculated_metrics),
            'metrics': AnalyticsMetricSerializer(calculated_metrics, many=True).data
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def calculate_metric_value(metric_type, start_date, end_date, filters):
    """Calculate metric value based on type"""
    if metric_type == 'active_users':
        return AnalyticsEvent.objects.filter(
            timestamp__gte=start_date,
            timestamp__lte=end_date,
            event_type__in=['user_login', 'course_view', 'lesson_start']
        ).values('user').distinct().count()

    elif metric_type == 'total_revenue':
        from payments.models import PaymentTransaction
        revenue_agg = PaymentTransaction.objects.filter(
            status='completed',
            created_at__gte=start_date,
            created_at__lte=end_date
        ).aggregate(total=Sum('amount'))
        return revenue_agg['total'] or 0

    elif metric_type == 'course_completions':
        from courses.models import Enrollment
        return Enrollment.objects.filter(
            status='completed',
            completed_at__gte=start_date,
            completed_at__lte=end_date
        ).count()

    # Add more metric calculations as needed
    return 0


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate a custom analytics report"""
    serializer = ReportGenerationSerializer(data=request.data)
    if serializer.is_valid():
        report_data = serializer.validated_data

        # Create report
        report = AnalyticsReport.objects.create(
            title=report_data['title'],
            description=report_data.get('description', ''),
            report_type=report_data['report_type'],
            config=report_data['config'],
            is_scheduled=report_data['is_scheduled'],
            schedule_frequency=report_data.get('schedule_frequency'),
            created_by=request.user
        )

        # Generate immediately if not scheduled
        if not report_data['is_scheduled']:
            try:
                report.generate_report(report_data['format_type'])
            except Exception as e:
                return Response({'detail': f'Report generation failed: {str(e)}'},
                              status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = AnalyticsReportSerializer(report)
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predictive_analytics(request):
    """Get predictive analytics for user/course"""
    serializer = PredictiveAnalyticsSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data

        # Simplified predictive analytics (would use ML models in production)
        user_id = data.get('user_id')
        course_id = data.get('course_id')
        prediction_type = data['prediction_type']
        time_horizon = data['time_horizon']

        # Mock predictions based on historical data
        if prediction_type == 'completion_probability':
            # Calculate based on user's past completion rate
            if user_id:
                from courses.models import Enrollment
                total_enrollments = Enrollment.objects.filter(student_id=user_id).count()
                completed = Enrollment.objects.filter(student_id=user_id, status='completed').count()
                probability = (completed / total_enrollments * 100) if total_enrollments > 0 else 50
            else:
                probability = 75  # Default

            prediction_data = {
                'prediction_value': round(probability, 2),
                'confidence_interval': [max(0, probability - 10), min(100, probability + 10)],
                'factors': [
                    {'factor': 'Past completion rate', 'impact': 'high'},
                    {'factor': 'Course difficulty', 'impact': 'medium'}
                ],
                'recommendations': ['Continue current learning pace', 'Focus on challenging topics']
            }

        elif prediction_type == 'at_risk_score':
            # Simplified risk calculation
            risk_score = 30  # Would be calculated based on engagement patterns
            prediction_data = {
                'prediction_value': risk_score,
                'confidence_interval': [risk_score - 5, risk_score + 5],
                'factors': [
                    {'factor': 'Low engagement', 'impact': 'high'},
                    {'factor': 'Missed deadlines', 'impact': 'medium'}
                ],
                'recommendations': ['Increase study time', 'Seek additional support']
            }

        else:
            return Response({'detail': f'Prediction type {prediction_type} not implemented'},
                          status=status.HTTP_400_BAD_REQUEST)

        response_data = {
            'user_id': user_id,
            'course_id': course_id,
            'prediction_type': prediction_type,
            'time_horizon': time_horizon,
            **prediction_data
        }

        response_serializer = PredictiveAnalyticsSerializer(response_data)
        return Response(response_data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
