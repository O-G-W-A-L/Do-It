from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import UserSession, LoginHistory
from ..serializers import UserSessionSerializer, LoginHistorySerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_security_dashboard(request):
    """Get user's security dashboard data"""
    # Active sessions
    sessions = UserSession.objects.filter(user=request.user, is_active=True)
    sessions_data = UserSessionSerializer(sessions, many=True).data

    # Recent login history (last 10)
    login_history = LoginHistory.objects.filter(user=request.user)[:10]
    history_data = LoginHistorySerializer(login_history, many=True).data

    # Account status
    account_locked = request.user.profile.is_account_locked
    failed_attempts = request.user.profile.failed_login_attempts

    return Response({
        'active_sessions': sessions_data,
        'recent_login_history': history_data,
        'account_status': {
            'is_locked': account_locked,
            'failed_login_attempts': failed_attempts,
            'lock_expires_at': request.user.profile.account_locked_until
        },
        'security_score': calculate_security_score(request.user)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_session(request, session_id):
    """Logout a specific session"""
    try:
        session = UserSession.objects.get(id=session_id, user=request.user, is_active=True)
        session.is_active = False
        session.save()

        # Log the action
        LoginHistory.objects.create(
            user=request.user,
            email=request.user.email,
            event_type='logout',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            details={'action': 'user_logout_session', 'session_id': session_id}
        )

        return Response({'detail': 'Session logged out successfully'})
    except UserSession.DoesNotExist:
        return Response({'detail': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_all_sessions(request):
    """Logout all user sessions except current"""
    current_session_key = request.session.session_key
    updated_count = UserSession.objects.filter(
        user=request.user,
        is_active=True
    ).exclude(session_key=current_session_key).update(is_active=False)

    # Log the action
    LoginHistory.objects.create(
        user=request.user,
        email=request.user.email,
        event_type='logout',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT'),
        details={'action': 'user_logout_all_sessions', 'sessions_ended': updated_count}
    )

    return Response({'detail': f'Logged out {updated_count} sessions'})


def calculate_security_score(user):
    """Calculate a simple security score for the user"""
    score = 50  # Base score

    # Profile completion (+10)
    if user.profile.is_profile_complete:
        score += 10

    # Password changed recently (+10)
    if user.profile.last_password_change and (timezone.now() - user.profile.last_password_change).days < 90:
        score += 10

    # No failed login attempts (+10)
    if user.profile.failed_login_attempts == 0:
        score += 10

    # Account not locked (+10)
    if not user.profile.is_account_locked:
        score += 10

    # Has profile image (+5)
    if user.profile.profile_image:
        score += 5

    # Has phone number (+5)
    if user.profile.phone_number:
        score += 5

    return min(score, 100)  # Max 100