from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth.models import User
from .models import (
    AnalyticsEvent, AnalyticsMetric, AnalyticsReport, AnalyticsDashboard,
    LearningRecommendation, PredictiveInsight, DataExport
)


class AnalyticsEventSerializer(serializers.ModelSerializer):
    """Serializer for analytics events"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = AnalyticsEvent
        fields = [
            'event_id', 'event_type', 'event_type_display', 'user', 'user_name',
            'session_id', 'ip_address', 'user_agent', 'related_objects',
            'event_data', 'timestamp', 'duration', 'source', 'version',
            'created_at'
        ]
        read_only_fields = ['event_id', 'created_at']


class AnalyticsMetricSerializer(serializers.ModelSerializer):
    """Serializer for analytics metrics"""
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)
    aggregation_period_display = serializers.CharField(source='get_aggregation_period_display', read_only=True)
    formatted_value = serializers.ReadOnlyField()

    class Meta:
        model = AnalyticsMetric
        fields = [
            'metric_id', 'metric_type', 'metric_type_display', 'aggregation_period',
            'aggregation_period_display', 'period_start', 'period_end', 'value',
            'value_type', 'formatted_value', 'filters', 'calculated_at',
            'data_points', 'created_at', 'updated_at'
        ]
        read_only_fields = ['metric_id', 'calculated_at', 'created_at', 'updated_at']


class AnalyticsReportSerializer(serializers.ModelSerializer):
    """Serializer for analytics reports"""
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = AnalyticsReport
        fields = [
            'report_id', 'title', 'description', 'report_type', 'report_type_display',
            'config', 'is_scheduled', 'schedule_frequency', 'next_run', 'created_by',
            'created_by_name', 'is_public', 'allowed_users', 'file_path', 'file_url',
            'file_size', 'last_generated', 'generation_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'report_id', 'created_by', 'file_path', 'file_url', 'file_size',
            'last_generated', 'generation_count', 'created_at', 'updated_at'
        ]

    def get_file_url(self, obj):
        """Get download URL for report file"""
        if obj.file_path:
            from django.urls import reverse
            return reverse('analytics:download-report', kwargs={'report_id': obj.report_id})
        return None

    def create(self, validated_data):
        """Create report with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AnalyticsDashboardSerializer(serializers.ModelSerializer):
    """Serializer for analytics dashboards"""
    dashboard_type_display = serializers.CharField(source='get_dashboard_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = AnalyticsDashboard
        fields = [
            'dashboard_id', 'title', 'description', 'dashboard_type', 'dashboard_type_display',
            'config', 'widgets', 'created_by', 'created_by_name', 'is_public', 'is_default',
            'last_viewed', 'view_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'dashboard_id', 'created_by', 'last_viewed', 'view_count', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create dashboard with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class LearningRecommendationSerializer(serializers.ModelSerializer):
    """Serializer for learning recommendations"""
    recommendation_type_display = serializers.CharField(source='get_recommendation_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    course_title = serializers.CharField(source='related_course.title', read_only=True)
    lesson_title = serializers.CharField(source='related_lesson.title', read_only=True)

    class Meta:
        model = LearningRecommendation
        fields = [
            'recommendation_id', 'user', 'user_name', 'recommendation_type',
            'recommendation_type_display', 'priority', 'priority_display', 'title',
            'description', 'action_url', 'action_text', 'reasoning', 'confidence_score',
            'related_course', 'course_title', 'related_lesson', 'lesson_title',
            'related_skill', 'is_active', 'is_viewed', 'is_dismissed', 'viewed_at',
            'dismissed_at', 'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'recommendation_id', 'reasoning', 'confidence_score', 'is_viewed',
            'is_dismissed', 'viewed_at', 'dismissed_at', 'created_at', 'updated_at'
        ]


class PredictiveInsightSerializer(serializers.ModelSerializer):
    """Serializer for predictive insights"""
    insight_type_display = serializers.CharField(source='get_insight_type_display', read_only=True)
    user_name = serializers.CharField(source='related_user.get_full_name', read_only=True)
    course_title = serializers.CharField(source='related_course.title', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)

    class Meta:
        model = PredictiveInsight
        fields = [
            'insight_id', 'insight_type', 'insight_type_display', 'title', 'description',
            'severity', 'confidence_score', 'impact_score', 'related_user', 'user_name',
            'related_course', 'course_title', 'insight_data', 'reasoning', 'recommended_actions',
            'is_active', 'is_resolved', 'resolved_at', 'resolved_by', 'resolved_by_name',
            'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'insight_id', 'insight_data', 'reasoning', 'recommended_actions',
            'is_resolved', 'resolved_at', 'resolved_by', 'created_at', 'updated_at'
        ]


class DataExportSerializer(serializers.ModelSerializer):
    """Serializer for data exports"""
    export_type_display = serializers.CharField(source='get_export_type_display', read_only=True)
    file_format_display = serializers.CharField(source='get_file_format_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = DataExport
        fields = [
            'export_id', 'export_type', 'export_type_display', 'title', 'filters', 'fields',
            'file_path', 'file_url', 'file_format', 'file_format_display', 'file_size',
            'record_count', 'is_anonymized', 'retention_period', 'gdpr_compliant',
            'requested_by', 'requested_by_name', 'approved_by', 'approved_by_name',
            'status', 'requested_at', 'approved_at', 'completed_at', 'expires_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'export_id', 'file_path', 'file_url', 'file_size', 'record_count',
            'approved_by', 'approved_at', 'completed_at', 'created_at', 'updated_at'
        ]

    def get_file_url(self, obj):
        """Get download URL for export file"""
        if obj.file_path and obj.status == 'completed':
            from django.urls import reverse
            return reverse('analytics:download-export', kwargs={'export_id': obj.export_id})
        return None

    def create(self, validated_data):
        """Create export request with current user as requester"""
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)


# Specialized serializers for specific use cases

class TrackEventSerializer(serializers.Serializer):
    """Serializer for tracking events"""
    event_type = serializers.ChoiceField(choices=AnalyticsEvent.EVENT_TYPES)
    related_objects = serializers.JSONField(required=False, default=dict)
    event_data = serializers.JSONField(required=False, default=dict)
    duration = serializers.DurationField(required=False)
    session_id = serializers.CharField(max_length=255, required=False)
    source = serializers.CharField(max_length=100, required=False, default='web')
    version = serializers.CharField(max_length=50, required=False)


class MetricsQuerySerializer(serializers.Serializer):
    """Serializer for metrics queries"""
    metric_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[choice[0] for choice in AnalyticsMetric.METRIC_TYPES]),
        required=False
    )
    aggregation_period = serializers.ChoiceField(
        choices=AnalyticsMetric.AGGREGATION_PERIODS,
        required=False,
        default='daily'
    )
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    filters = serializers.JSONField(required=False, default=dict)

    def validate(self, data):
        """Set default date range if not provided"""
        if not data.get('start_date'):
            data['start_date'] = timezone.now() - timezone.timedelta(days=30)
        if not data.get('end_date'):
            data['end_date'] = timezone.now()
        return data


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_users = serializers.IntegerField()
    active_users_today = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    course_completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_session_duration = serializers.DurationField()
    top_courses = serializers.ListField(child=serializers.DictField())
    recent_activity = serializers.ListField(child=serializers.DictField())


class UserEngagementSerializer(serializers.Serializer):
    """Serializer for user engagement analytics"""
    user_id = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    total_time_spent = serializers.DurationField()
    courses_enrolled = serializers.IntegerField()
    courses_completed = serializers.IntegerField()
    completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_quiz_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    last_activity = serializers.DateTimeField()
    engagement_score = serializers.DecimalField(max_digits=3, decimal_places=2)


class CoursePerformanceSerializer(serializers.Serializer):
    """Serializer for course performance analytics"""
    course_id = serializers.IntegerField()
    course_title = serializers.CharField()
    total_enrollments = serializers.IntegerField()
    total_completions = serializers.IntegerField()
    completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_completion_time = serializers.DurationField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=1)
    drop_off_points = serializers.ListField(child=serializers.DictField())
    quiz_performance = serializers.ListField(child=serializers.DictField())


class RevenueAnalyticsSerializer(serializers.Serializer):
    """Serializer for revenue analytics"""
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    monthly_revenue = serializers.ListField(child=serializers.DictField())
    revenue_by_course = serializers.ListField(child=serializers.DictField())
    revenue_by_subscription = serializers.ListField(child=serializers.DictField())
    average_transaction_value = serializers.DecimalField(max_digits=8, decimal_places=2)
    conversion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class LearningPathSerializer(serializers.Serializer):
    """Serializer for learning path recommendations"""
    user_id = serializers.IntegerField()
    current_skills = serializers.ListField(child=serializers.CharField())
    recommended_courses = serializers.ListField(child=serializers.DictField())
    skill_gaps = serializers.ListField(child=serializers.DictField())
    estimated_completion_time = serializers.DurationField()
    confidence_score = serializers.DecimalField(max_digits=3, decimal_places=2)


class PredictiveAnalyticsSerializer(serializers.Serializer):
    """Serializer for predictive analytics"""
    user_id = serializers.IntegerField(required=False)
    course_id = serializers.IntegerField(required=False)
    prediction_type = serializers.ChoiceField(choices=[
        ('completion_probability', 'Completion Probability'),
        ('at_risk_score', 'At-Risk Score'),
        ('recommended_difficulty', 'Recommended Difficulty'),
        ('estimated_completion_time', 'Estimated Completion Time'),
    ])
    time_horizon = serializers.ChoiceField(choices=[
        ('1_week', '1 Week'),
        ('1_month', '1 Month'),
        ('3_months', '3 Months'),
        ('6_months', '6 Months'),
    ], required=False, default='1_month')

    # Results
    prediction_value = serializers.DecimalField(max_digits=5, decimal_places=2)
    confidence_interval = serializers.ListField(child=serializers.DecimalField(max_digits=5, decimal_places=2))
    factors = serializers.ListField(child=serializers.DictField())
    recommendations = serializers.ListField(child=serializers.CharField())


class ReportGenerationSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    report_type = serializers.ChoiceField(choices=AnalyticsReport.REPORT_TYPES)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    config = serializers.JSONField(default=dict)
    format_type = serializers.ChoiceField(choices=AnalyticsReport.EXPORT_FORMATS, default='csv')
    is_scheduled = serializers.BooleanField(default=False)
    schedule_frequency = serializers.ChoiceField(
        choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')],
        required=False
    )


class BulkMetricsCalculationSerializer(serializers.Serializer):
    """Serializer for bulk metrics calculation"""
    metric_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[choice[0] for choice in AnalyticsMetric.METRIC_TYPES])
    )
    aggregation_period = serializers.ChoiceField(choices=AnalyticsMetric.AGGREGATION_PERIODS, default='daily')
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    filters = serializers.JSONField(default=dict)

    def validate(self, data):
        """Validate date range"""
        if data['start_date'] >= data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data
