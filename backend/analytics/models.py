from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import uuid
import json
import csv
from io import StringIO, BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from datetime import timedelta


class AnalyticsEvent(models.Model):
    """
    Raw event tracking for all user and system activities
    """
    EVENT_TYPES = [
        # User events
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
        ('profile_update', 'Profile Update'),
        ('password_change', 'Password Change'),

        # Course events
        ('course_view', 'Course View'),
        ('course_enroll', 'Course Enrollment'),
        ('course_complete', 'Course Completion'),
        ('course_drop', 'Course Drop'),

        # Learning events
        ('lesson_start', 'Lesson Start'),
        ('lesson_complete', 'Lesson Complete'),
        ('quiz_attempt', 'Quiz Attempt'),
        ('quiz_complete', 'Quiz Complete'),
        ('assignment_submit', 'Assignment Submit'),

        # Progress events
        ('milestone_achieved', 'Milestone Achieved'),
        ('streak_achieved', 'Streak Achieved'),
        ('skill_learned', 'Skill Learned'),

        # Payment events
        ('payment_initiated', 'Payment Initiated'),
        ('payment_completed', 'Payment Completed'),
        ('payment_failed', 'Payment Failed'),
        ('subscription_created', 'Subscription Created'),
        ('subscription_cancelled', 'Subscription Cancelled'),

        # Notification events
        ('notification_sent', 'Notification Sent'),
        ('notification_delivered', 'Notification Delivered'),
        ('notification_read', 'Notification Read'),

        # System events
        ('error_occurred', 'Error Occurred'),
        ('performance_metric', 'Performance Metric'),
        ('api_call', 'API Call'),
    ]

    event_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='analytics_events')

    # Event context
    session_id = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    # Related objects (flexible JSON for extensibility)
    related_objects = models.JSONField(help_text="Related courses, lessons, quizzes, etc.", default=dict)

    # Event data
    event_data = models.JSONField(help_text="Additional event-specific data", default=dict)

    # Timing
    timestamp = models.DateTimeField(default=timezone.now)
    duration = models.DurationField(null=True, blank=True)  # For time-based events

    # Metadata
    source = models.CharField(max_length=100, default='web')  # web, mobile, api
    version = models.CharField(max_length=50, blank=True)  # App version

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['event_type', 'user']),
        ]

    def __str__(self):
        return f"{self.event_type} by {self.user.username if self.user else 'Anonymous'} at {self.timestamp}"

    @classmethod
    def track_event(cls, event_type, user=None, **kwargs):
        """Convenience method to track an event"""
        event_data = kwargs.pop('event_data', {})
        related_objects = kwargs.pop('related_objects', {})

        return cls.objects.create(
            event_type=event_type,
            user=user,
            event_data=event_data,
            related_objects=related_objects,
            **kwargs
        )


class AnalyticsMetric(models.Model):
    """
    Calculated metrics and KPIs
    """
    METRIC_TYPES = [
        # User metrics
        ('active_users', 'Active Users'),
        ('new_users', 'New Users'),
        ('returning_users', 'Returning Users'),
        ('user_engagement', 'User Engagement Score'),

        # Course metrics
        ('course_enrollments', 'Course Enrollments'),
        ('course_completions', 'Course Completions'),
        ('course_completion_rate', 'Course Completion Rate'),
        ('average_course_duration', 'Average Course Duration'),

        # Learning metrics
        ('lesson_completions', 'Lesson Completions'),
        ('quiz_attempts', 'Quiz Attempts'),
        ('quiz_pass_rate', 'Quiz Pass Rate'),
        ('assignment_submissions', 'Assignment Submissions'),

        # Revenue metrics
        ('total_revenue', 'Total Revenue'),
        ('average_transaction', 'Average Transaction Value'),
        ('subscription_revenue', 'Subscription Revenue'),
        ('course_revenue', 'Course Revenue'),

        # Engagement metrics
        ('time_spent_learning', 'Time Spent Learning'),
        ('daily_active_users', 'Daily Active Users'),
        ('session_duration', 'Average Session Duration'),
        ('feature_usage', 'Feature Usage'),
    ]

    AGGREGATION_PERIODS = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]

    metric_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    aggregation_period = models.CharField(max_length=20, choices=AGGREGATION_PERIODS, default='daily')

    # Time period
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()

    # Metric value
    value = models.DecimalField(max_digits=20, decimal_places=4)
    value_type = models.CharField(max_length=50, default='count')  # count, percentage, duration, currency

    # Filters/context
    filters = models.JSONField(help_text="Applied filters (course, user group, etc.)", default=dict)

    # Metadata
    calculated_at = models.DateTimeField(default=timezone.now)
    data_points = models.PositiveIntegerField(default=0)  # Number of events aggregated

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_start', 'metric_type']
        unique_together = ['metric_type', 'aggregation_period', 'period_start', 'filters']
        indexes = [
            models.Index(fields=['metric_type', 'period_start']),
            models.Index(fields=['aggregation_period', 'period_start']),
            models.Index(fields=['period_start']),
        ]

    def __str__(self):
        return f"{self.metric_type} ({self.aggregation_period}): {self.value} for {self.period_start.date()}"

    @property
    def formatted_value(self):
        """Return formatted value based on type"""
        if self.value_type == 'percentage':
            return f"{self.value:.1f}%"
        elif self.value_type == 'duration':
            # Convert seconds to human readable
            total_seconds = int(self.value)
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{minutes}m {seconds}s"
        elif self.value_type == 'currency':
            return f"${self.value:,.2f}"
        else:
            return f"{int(self.value)}"


class AnalyticsReport(models.Model):
    """
    Saved reports with customizable parameters
    """
    REPORT_TYPES = [
        ('user_engagement', 'User Engagement Report'),
        ('course_performance', 'Course Performance Report'),
        ('revenue_analytics', 'Revenue Analytics Report'),
        ('learning_outcomes', 'Learning Outcomes Report'),
        ('platform_health', 'Platform Health Report'),
        ('custom', 'Custom Report'),
    ]

    EXPORT_FORMATS = [
        ('csv', 'CSV'),
        ('pdf', 'PDF'),
        ('json', 'JSON'),
        ('xlsx', 'Excel'),
    ]

    report_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)

    # Report configuration
    config = models.JSONField(help_text="Report configuration (filters, metrics, etc.)", default=dict)

    # Scheduling
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], blank=True)
    next_run = models.DateTimeField(null=True, blank=True)

    # Access control
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    is_public = models.BooleanField(default=False)
    allowed_users = models.ManyToManyField(User, blank=True, related_name='accessible_reports')

    # File storage
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveIntegerField(default=0)

    # Metadata
    last_generated = models.DateTimeField(null=True, blank=True)
    generation_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.report_type})"

    def can_access(self, user):
        """Check if user can access this report"""
        if self.is_public:
            return True
        if self.created_by == user:
            return True
        if user in self.allowed_users.all():
            return True
        if user.profile.is_admin:
            return True
        return False

    def generate_report(self, format_type='csv'):
        """Generate and save the report"""
        if format_type == 'csv':
            content = self._generate_csv()
            filename = f"report_{self.report_id}.csv"
        elif format_type == 'pdf':
            content = self._generate_pdf()
            filename = f"report_{self.report_id}.pdf"
        elif format_type == 'json':
            content = self._generate_json()
            filename = f"report_{self.report_id}.json"
        else:
            raise ValueError(f"Unsupported format: {format_type}")

        # Save file
        file_path = f"analytics/reports/{filename}"
        if isinstance(content, str):
            content = content.encode('utf-8')

        file_obj = ContentFile(content)
        self.file_path = default_storage.save(file_path, file_obj)
        self.file_size = len(content)
        self.last_generated = timezone.now()
        self.generation_count += 1
        self.save()

        return self.file_path

    def _generate_csv(self):
        """Generate CSV report"""
        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(['Metric', 'Period', 'Value', 'Type'])

        # Write data (simplified example)
        metrics = AnalyticsMetric.objects.filter(
            period_start__gte=timezone.now() - timedelta(days=30)
        ).order_by('period_start')[:100]

        for metric in metrics:
            writer.writerow([
                metric.metric_type,
                metric.period_start.date(),
                metric.value,
                metric.value_type
            ])

        return output.getvalue()

    def _generate_pdf(self):
        """Generate PDF report"""
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Simple PDF generation
        p.drawString(100, height - 100, f"Analytics Report: {self.title}")
        p.drawString(100, height - 120, f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Add some sample data
        y_position = height - 160
        metrics = AnalyticsMetric.objects.filter(
            period_start__gte=timezone.now() - timedelta(days=7)
        ).order_by('-value')[:10]

        for metric in metrics:
            if y_position < 100:
                p.showPage()
                y_position = height - 100

            p.drawString(100, y_position, f"{metric.metric_type}: {metric.formatted_value}")
            y_position -= 20

        p.save()
        buffer.seek(0)
        return buffer.getvalue()

    def _generate_json(self):
        """Generate JSON report"""
        data = {
            'report_title': self.title,
            'generated_at': timezone.now().isoformat(),
            'metrics': []
        }

        metrics = AnalyticsMetric.objects.filter(
            period_start__gte=timezone.now() - timedelta(days=30)
        ).values(
            'metric_type', 'period_start', 'value', 'value_type'
        ).order_by('period_start')[:50]

        data['metrics'] = list(metrics)
        return json.dumps(data, indent=2, default=str)


class AnalyticsDashboard(models.Model):
    """
    Customizable dashboards for different user roles
    """
    DASHBOARD_TYPES = [
        ('student', 'Student Dashboard'),
        ('instructor', 'Instructor Dashboard'),
        ('admin', 'Admin Dashboard'),
        ('custom', 'Custom Dashboard'),
    ]

    dashboard_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    dashboard_type = models.CharField(max_length=20, choices=DASHBOARD_TYPES)

    # Dashboard configuration
    config = models.JSONField(help_text="Dashboard layout and widget configuration", default=dict)

    # Widgets (stored as JSON for flexibility)
    widgets = models.JSONField(help_text="Dashboard widgets configuration", default=list)

    # Access control
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_dashboards')
    is_public = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)  # Default dashboard for role

    # Metadata
    last_viewed = models.DateTimeField(null=True, blank=True)
    view_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.dashboard_type})"

    def can_access(self, user):
        """Check if user can access this dashboard"""
        if self.is_public:
            return True
        if self.created_by == user:
            return True
        if user.profile.is_admin:
            return True
        # Role-based access
        if self.dashboard_type == 'student' and user.profile.is_student:
            return True
        if self.dashboard_type == 'instructor' and user.profile.is_instructor:
            return True
        if self.dashboard_type == 'admin' and user.profile.is_admin:
            return True
        return False

    def record_view(self):
        """Record dashboard view"""
        self.last_viewed = timezone.now()
        self.view_count += 1
        self.save()


class LearningRecommendation(models.Model):
    """
    Personalized learning recommendations for students
    """
    RECOMMENDATION_TYPES = [
        ('course_suggestion', 'Course Suggestion'),
        ('skill_building', 'Skill Building'),
        ('practice_exercise', 'Practice Exercise'),
        ('review_material', 'Review Material'),
        ('peer_learning', 'Peer Learning'),
        ('career_path', 'Career Path'),
    ]

    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    recommendation_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_recommendations')
    recommendation_type = models.CharField(max_length=50, choices=RECOMMENDATION_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')

    # Recommendation content
    title = models.CharField(max_length=200)
    description = models.TextField()
    action_url = models.URLField(blank=True)
    action_text = models.CharField(max_length=100, blank=True)

    # Reasoning and data
    reasoning = models.JSONField(help_text="AI/ML reasoning for this recommendation", default=dict)
    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)

    # Related objects
    related_course = models.ForeignKey('courses.Course', on_delete=models.SET_NULL, null=True, blank=True)
    related_lesson = models.ForeignKey('courses.Lesson', on_delete=models.SET_NULL, null=True, blank=True)
    related_skill = models.CharField(max_length=100, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_viewed = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)

    # Scheduling
    expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-priority']

    def __str__(self):
        return f"{self.recommendation_type} for {self.user.username}: {self.title}"

    def mark_viewed(self):
        """Mark recommendation as viewed"""
        self.is_viewed = True
        self.viewed_at = timezone.now()
        self.save()

    def mark_dismissed(self):
        """Mark recommendation as dismissed"""
        self.is_dismissed = True
        self.dismissed_at = timezone.now()
        self.save()


class PredictiveInsight(models.Model):
    """
    Predictive analytics and insights
    """
    INSIGHT_TYPES = [
        ('at_risk_student', 'At-Risk Student'),
        ('course_completion_prediction', 'Course Completion Prediction'),
        ('skill_gap_identification', 'Skill Gap Identification'),
        ('engagement_trend', 'Engagement Trend'),
        ('performance_anomaly', 'Performance Anomaly'),
        ('churn_risk', 'Churn Risk'),
    ]

    insight_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()

    # Insight data
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ], default='medium')

    confidence_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)
    impact_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.50)

    # Related entities
    related_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    related_course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, null=True, blank=True)

    # Insight data and reasoning
    insight_data = models.JSONField(help_text="Detailed insight data", default=dict)
    reasoning = models.JSONField(help_text="AI/ML reasoning", default=dict)

    # Actions and recommendations
    recommended_actions = models.JSONField(help_text="Suggested actions", default=list)

    # Status
    is_active = models.BooleanField(default=True)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='resolved_insights')

    # Scheduling
    expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-severity']

    def __str__(self):
        return f"{self.insight_type}: {self.title}"

    def resolve(self, user):
        """Mark insight as resolved"""
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.save()


class DataExport(models.Model):
    """
    Track data exports for compliance and auditing
    """
    EXPORT_TYPES = [
        ('user_data', 'User Data Export'),
        ('analytics_data', 'Analytics Data Export'),
        ('compliance_report', 'Compliance Report'),
        ('research_data', 'Research Data Export'),
    ]

    export_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    export_type = models.CharField(max_length=50, choices=EXPORT_TYPES)
    title = models.CharField(max_length=200)

    # Export configuration
    filters = models.JSONField(help_text="Data filters applied", default=dict)
    fields = models.JSONField(help_text="Fields to export", default=list)

    # File information
    file_path = models.CharField(max_length=500, blank=True)
    file_format = models.CharField(max_length=10, choices=[
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('xlsx', 'Excel'),
    ], default='csv')
    file_size = models.PositiveIntegerField(default=0)
    record_count = models.PositiveIntegerField(default=0)

    # Privacy and compliance
    is_anonymized = models.BooleanField(default=True)
    retention_period = models.DurationField(default=timedelta(days=30))
    gdpr_compliant = models.BooleanField(default=True)

    # Access control
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_exports')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_exports')

    # Status
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ], default='pending')

    # Timestamps
    requested_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.export_type} export by {self.requested_by.username}"

    def approve(self, user):
        """Approve the data export"""
        self.status = 'approved'
        self.approved_by = user
        self.approved_at = timezone.now()
        self.expires_at = timezone.now() + self.retention_period
        self.save()

    def complete(self):
        """Mark export as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
