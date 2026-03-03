from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..serializers import UserSerializer


# Admin Dashboard View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """Admin dashboard with overview statistics"""
    try:
        if not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except AttributeError:
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count, Sum, Avg
    from courses.models import Course, Enrollment
    from progress.models import Progress
    from payments.models import Transaction
    from notifications.models import Notification
    
    User = get_user_model()
    
    # Get counts
    total_users = User.objects.count()
    total_courses = Course.objects.count()
    total_enrollments = Enrollment.objects.count()
    active_enrollments = Enrollment.objects.filter(status='active').count()
    
    # Revenue
    total_revenue = Transaction.objects.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Recent activity
    recent_enrollments = Enrollment.objects.order_by('-enrolled_at')[:5]
    recent_users = User.objects.order_by('-date_joined')[:5]
    
    # Completion rate
    completed_enrollments = Enrollment.objects.filter(status='completed').count()
    completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    
    # Serialize recent enrollments manually
    recent_enrollments_data = []
    for enrollment in recent_enrollments:
        recent_enrollments_data.append({
            'id': enrollment.id,
            'course_title': enrollment.course.title,
            'student': enrollment.student.username,
            'status': enrollment.get_status_display(),
            'enrolled_at': enrollment.enrolled_at,
            'progress_percentage': enrollment.progress_percentage,
        })
    
    return Response({
        'total_users': total_users,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'active_enrollments': active_enrollments,
        'completed_enrollments': completed_enrollments,
        'completion_rate': round(completion_rate, 2),
        'total_revenue': float(total_revenue),
        'recent_enrollments': recent_enrollments_data,
        'recent_users': UserSerializer(recent_users, many=True).data,
    })


# Admin Stats View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Detailed admin statistics"""
    try:
        if not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except AttributeError:
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count
    from courses.models import Course, Enrollment
    from payments.models import Transaction
    
    User = get_user_model()
    
    # Users by role
    users_by_role = User.objects.annotate(role_count=Count('profile__role')).values('profile__role').annotate(count=Count('id'))
    
    # Courses by status
    courses_by_status = Course.objects.values('status').annotate(count=Count('id'))
    
    # Enrollments by status
    enrollments_by_status = Enrollment.objects.values('status').annotate(count=Count('id'))
    
    # Monthly enrollments (last 6 months)
    from django.utils import timezone
    from datetime import timedelta
    six_months_ago = timezone.now() - timedelta(days=180)
    monthly_enrollments = Enrollment.objects.filter(
        enrolled_at__gte=six_months_ago
    ).extra(
        select={'month': "TO_CHAR(enrolled_at, 'YYYY-MM')"}
    ).values('month').annotate(count=Count('id'))
    
    return Response({
        'users_by_role': list(users_by_role),
        'courses_by_status': list(courses_by_status),
        'enrollments_by_status': list(enrollments_by_status),
        'monthly_enrollments': list(monthly_enrollments),
    })