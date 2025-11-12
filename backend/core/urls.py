from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints organized by domain
    path('api/auth/', include('users.urls')),      # Authentication & user management
    path('api/courses/', include('courses.urls')), # Course content & enrollment
    path('api/progress/', include('progress.urls')), # Learning progress & analytics
    path('api/payments/', include('payments.urls')), # Payment processing & billing
    path('api/notifications/', include('notifications.urls')), # Notification system
    path('api/analytics/', include('analytics.urls')), # Analytics & insights
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
