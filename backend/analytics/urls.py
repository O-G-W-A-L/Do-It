from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsEventViewSet, AnalyticsMetricViewSet, AnalyticsReportViewSet,
    AnalyticsDashboardViewSet, LearningRecommendationViewSet,
    PredictiveInsightViewSet, DataExportViewSet, track_event,
    dashboard_stats, user_engagement, course_performance, revenue_analytics,
    learning_recommendations, calculate_metrics, generate_report,
    predictive_analytics
)

router = DefaultRouter()
router.register(r'events', AnalyticsEventViewSet)
router.register(r'metrics', AnalyticsMetricViewSet)
router.register(r'reports', AnalyticsReportViewSet)
router.register(r'dashboards', AnalyticsDashboardViewSet)
router.register(r'recommendations', LearningRecommendationViewSet)
router.register(r'insights', PredictiveInsightViewSet)
router.register(r'exports', DataExportViewSet)

urlpatterns = [
    # ViewSet endpoints
    path('', include(router.urls)),

    # Analytics endpoints
    path('track-event/', track_event, name='track-event'),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('user-engagement/<int:user_id>/', user_engagement, name='user-engagement'),
    path('user-engagement/', user_engagement, name='user-engagement-current'),
    path('course-performance/<int:course_id>/', course_performance, name='course-performance'),
    path('revenue-analytics/', revenue_analytics, name='revenue-analytics'),
    path('learning-recommendations/', learning_recommendations, name='learning-recommendations'),

    # Processing endpoints
    path('calculate-metrics/', calculate_metrics, name='calculate-metrics'),
    path('generate-report/', generate_report, name='generate-report'),
    path('predictive-analytics/', predictive_analytics, name='predictive-analytics'),

    # Download endpoints
    path('reports/<uuid:report_id>/download/', AnalyticsReportViewSet.as_view({'get': 'download'}), name='download-report'),
    path('exports/<uuid:export_id>/download/', DataExportViewSet.as_view({'get': 'download'}), name='download-export'),
]
