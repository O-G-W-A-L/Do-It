from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from rest_framework import status, parsers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter

from ..models import Profile, EmailVerification, UserSession, LoginHistory, UserBan, UserStatus
from ..serializers import (
    UserSerializer, ProfileSerializer,
    UserSessionSerializer, LoginHistorySerializer, UserBanSerializer, UserStatusSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserManagementViewSet(ModelViewSet):
    """
    Admin viewset for managing users (full CRUD operations)
    """
    queryset = get_user_model().objects.select_related('profile').all()
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login', 'is_active']
    ordering = ['-date_joined']

    def get_queryset(self):
        # Only admins can access this
        try:
            if not self.request.user.profile.is_admin:
                return self.queryset.none()
        except AttributeError:
            # User doesn't have a profile, deny access
            return self.queryset.none()

        queryset = self.queryset

        # Custom filtering
        role = self.request.query_params.get('role')
        if role and role != 'all':
            queryset = queryset.filter(profile__role=role)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == 'false':
                queryset = queryset.filter(is_active=False)

        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserSerializer  # Could create AdminUserSerializer if needed
        return UserSerializer

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        new_role = request.data.get('role')

        if new_role not in ['student', 'instructor', 'admin']:
            return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        user.profile.role = new_role
        user.profile.save()

        return Response({'detail': f'User role changed to {new_role}'})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activate/deactivate user account (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.is_active = not user.is_active
        user.save()

        status_text = 'activated' if user.is_active else 'deactivated'
        return Response({'detail': f'User account {status_text}'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'students': Profile.objects.filter(role='student').count(),
            'instructors': Profile.objects.filter(role='instructor').count(),
            'admins': Profile.objects.filter(role='admin').count(),
        }

        return Response(stats)

    @action(detail=False, methods=['post'])
    def bulk_change_role(self, request):
        """Bulk change user roles (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user_ids = request.data.get('user_ids', [])
        new_role = request.data.get('role')

        if not user_ids or not new_role:
            return Response({'detail': 'user_ids and role are required'}, status=status.HTTP_400_BAD_REQUEST)

        if new_role not in ['student', 'instructor', 'admin']:
            return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        updated_count = User.objects.filter(id__in=user_ids).update(profile__role=new_role)

        return Response({'detail': f'Updated {updated_count} users to {new_role} role'})

    @action(detail=False, methods=['post'])
    def bulk_toggle_active(self, request):
        """Bulk activate/deactivate users (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user_ids = request.data.get('user_ids', [])
        is_active = request.data.get('is_active')

        if not user_ids or is_active is None:
            return Response({'detail': 'user_ids and is_active are required'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        updated_count = User.objects.filter(id__in=user_ids).update(is_active=is_active)

        status_text = 'activated' if is_active else 'deactivated'
        return Response({'detail': f'{status_text.capitalize()} {updated_count} users'})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password and send reset email (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()

        # Create password reset token
        ev = EmailVerification.objects.create(user=user)

        reset_url = f"{settings.FRONTEND_URL}/reset-password/{ev.token}/"
        try:
            send_mail(
                subject='Password Reset by Administrator',
                message=f'Your password has been reset by an administrator. Click here to set a new password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'detail': 'Password reset email sent to user'})
        except Exception as e:
            ev.delete()  # Clean up on failure
            return Response({'detail': 'Failed to send reset email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def force_password_change(self, request, pk=None):
        """Force user to change password on next login (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.profile.last_password_change = timezone.now() - timedelta(days=365)  # Force change
        user.profile.save(update_fields=['last_password_change'])

        return Response({'detail': 'User will be forced to change password on next login'})

    @action(detail=True, methods=['post'])
    def unlock_account(self, request, pk=None):
        """Unlock a locked user account (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.profile.failed_login_attempts = 0
        user.profile.account_locked_until = None
        user.profile.save(update_fields=['failed_login_attempts', 'account_locked_until'])

        return Response({'detail': 'User account unlocked'})

    @action(detail=True, methods=['get'])
    def sessions(self, request, pk=None):
        """Get user's active sessions (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        sessions = UserSession.objects.filter(user=user, is_active=True)
        serializer = UserSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def logout_session(self, request, pk=None):
        """Force logout a specific session (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'detail': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = UserSession.objects.get(id=session_id, user_id=pk)
            session.is_active = False
            session.save()
            return Response({'detail': 'Session logged out'})
        except UserSession.DoesNotExist:
            return Response({'detail': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def login_history(self, request, pk=None):
        """Get user's login history (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        history = LoginHistory.objects.filter(user=user)[:50]  # Last 50 events
        serializer = LoginHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ban_user(self, request, pk=None):
        """Ban a user (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        ban_type = request.data.get('ban_type', 'temporary')
        reason = request.data.get('reason', '')
        expires_at = request.data.get('expires_at')

        if ban_type not in ['temporary', 'permanent']:
            return Response({'detail': 'Invalid ban type'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user is already banned
        active_ban = UserBan.objects.filter(user=user, is_active=True).first()
        if active_ban:
            return Response({'detail': 'User is already banned'}, status=status.HTTP_400_BAD_REQUEST)

        ban = UserBan.objects.create(
            user=user,
            ban_type=ban_type,
            reason=reason,
            banned_by=request.user,
            expires_at=expires_at
        )

        return Response({
            'detail': f'User {ban_type} banned',
            'ban_id': ban.id
        })

    @action(detail=True, methods=['post'])
    def unban_user(self, request, pk=None):
        """Unban a user (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        ban = UserBan.objects.filter(user=user, is_active=True).first()
        if not ban:
            return Response({'detail': 'User is not banned'}, status=status.HTTP_400_BAD_REQUEST)

        ban.is_active = False
        ban.save()
        return Response({'detail': 'User unbanned'})

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Set user status (suspend, expire, etc.) (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        expires_at = request.data.get('expires_at')
        notes = request.data.get('notes', '')

        if new_status not in ['active', 'suspended', 'expired', 'pending_verification']:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or update user status
        user_status, created = UserStatus.objects.get_or_create(
            user=user,
            defaults={
                'status': new_status,
                'reason': reason,
                'set_by': request.user,
                'expires_at': expires_at,
                'notes': notes
            }
        )

        if not created:
            user_status.status = new_status
            user_status.reason = reason
            user_status.set_by = request.user
            user_status.set_at = timezone.now()
            user_status.expires_at = expires_at
            user_status.notes = notes
            user_status.save()

        return Response({'detail': f'User status set to {new_status}'})

    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """Get user's course enrollments (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        from courses.models import Enrollment
        enrollments = Enrollment.objects.filter(student=user).select_related('course')
        data = []
        for enrollment in enrollments:
            data.append({
                'id': enrollment.id,
                'course_title': enrollment.course.title,
                'status': enrollment.get_status_display(),
                'enrolled_at': enrollment.enrolled_at,
                'progress_percentage': enrollment.progress_percentage,
                'completed_at': enrollment.completed_at
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def logout_all_sessions(self, request, pk=None):
        """Force logout all user sessions (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        # Mark all active sessions as inactive
        updated_count = UserSession.objects.filter(user=user, is_active=True).update(is_active=False)

        # Log the action
        LoginHistory.objects.create(
            user=user,
            email=user.email,
            event_type='logout',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            details={'action': 'admin_forced_logout_all', 'admin': request.user.username}
        )

        return Response({'detail': f'Logged out {updated_count} sessions'})

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete a user (admin only) - requires confirmation"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        confirm_delete = request.data.get('confirm_delete', False)
        reason = request.data.get('reason', '')

        if not confirm_delete:
            return Response({'detail': 'Deletion must be confirmed'}, status=status.HTTP_400_BAD_REQUEST)

        user = self.get_object()

        # Prevent deletion of admin users for safety
        if user.profile.is_admin:
            return Response({'detail': 'Cannot delete admin users'}, status=status.HTTP_400_BAD_REQUEST)

        # Log the deletion
        LoginHistory.objects.create(
            email=user.email,
            event_type='account_locked',  # Using existing type for audit
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            details={
                'action': 'permanent_deletion',
                'admin': request.user.username,
                'reason': reason,
                'user_id': user.id
            }
        )

        # Delete the user (this will cascade delete related data)
        user.delete()

        return Response({'detail': 'User permanently deleted'})

    @action(detail=True, methods=['post'])
    def bulk_enroll(self, request, pk=None):
        """Bulk enroll user in multiple courses (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        course_ids = request.data.get('course_ids', [])

        if not course_ids:
            return Response({'detail': 'course_ids are required'}, status=status.HTTP_400_BAD_REQUEST)

        from courses.models import Course, Enrollment
        enrolled_count = 0
        already_enrolled = []

        for course_id in course_ids:
            try:
                course = Course.objects.get(id=course_id)
                # Check if already enrolled
                if Enrollment.objects.filter(student=user, course=course).exists():
                    already_enrolled.append(course.title)
                    continue

                # Create enrollment
                Enrollment.objects.create(
                    student=user,
                    course=course,
                    status='active'
                )
                enrolled_count += 1

            except Course.DoesNotExist:
                continue

        result = {'detail': f'Enrolled in {enrolled_count} courses'}
        if already_enrolled:
            result['already_enrolled'] = already_enrolled

        return Response(result)

    @action(detail=True, methods=['post'])
    def bulk_unenroll(self, request, pk=None):
        """Bulk unenroll user from multiple courses (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        course_ids = request.data.get('course_ids', [])

        if not course_ids:
            return Response({'detail': 'course_ids are required'}, status=status.HTTP_400_BAD_REQUEST)

        from courses.models import Enrollment
        deleted_count = Enrollment.objects.filter(
            student=user,
            course_id__in=course_ids
        ).delete()[0]

        return Response({'detail': f'Unenrolled from {deleted_count} courses'})

    @action(detail=True, methods=['post'])
    def extend_enrollment(self, request, pk=None):
        """Extend course enrollment expiry (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        enrollment_id = request.data.get('enrollment_id')
        new_expiry = request.data.get('expires_at')
        reason = request.data.get('reason', '')

        if not enrollment_id or not new_expiry:
            return Response({'detail': 'enrollment_id and expires_at are required'}, status=status.HTTP_400_BAD_REQUEST)

        from courses.models import Enrollment
        try:
            enrollment = Enrollment.objects.get(id=enrollment_id, student=user)
            enrollment.expires_at = new_expiry
            enrollment.save()

            return Response({'detail': 'Enrollment extended successfully'})
        except Enrollment.DoesNotExist:
            return Response({'detail': 'Enrollment not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def assign_cohort(self, request, pk=None):
        """Assign a cohort to a mentor (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        cohort_id = request.data.get('cohort_id')
        
        if not cohort_id:
            return Response({'detail': 'cohort_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from progress.models import Cohort
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            return Response({'detail': 'Cohort not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user.profile.assigned_cohorts.add(cohort)
        
        return Response({'detail': f'Cohort {cohort.name} assigned to {user.username}'})

    @action(detail=True, methods=['post'])
    def remove_cohort(self, request, pk=None):
        """Remove a cohort from a mentor (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        cohort_id = request.data.get('cohort_id')
        
        if not cohort_id:
            return Response({'detail': 'cohort_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from progress.models import Cohort
        
        try:
            cohort = Cohort.objects.get(id=cohort_id)
        except Cohort.DoesNotExist:
            return Response({'detail': 'Cohort not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user.profile.assigned_cohorts.remove(cohort)
        
        return Response({'detail': f'Cohort {cohort.name} removed from {user.username}'})

    @action(detail=False, methods=['get'])
    def all_cohorts(self, request):
        """Get all available cohorts (admin only)"""
        try:
            if not request.user.profile.is_admin:
                return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        except AttributeError:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        from progress.models import Cohort
        from progress.serializers import CohortSerializer
        
        cohorts = Cohort.objects.all().order_by('-start_date')
        serializer = CohortSerializer(cohorts, many=True)
        
        return Response(serializer.data)