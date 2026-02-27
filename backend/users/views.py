from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.db.models import Q, F
from rest_framework import status, parsers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter

from allauth.account.views import ConfirmEmailView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from .models import Profile, EmailVerification, AdminInvitation, UserSession, LoginHistory, UserBan, UserStatus
from .serializers import (
    UserSerializer, ProfileSerializer, AdminUserSerializer,
    UserSessionSerializer, LoginHistorySerializer, UserBanSerializer, UserStatusSerializer,
    UserPreferencesSerializer,
    RegisterSerializer, VerifyEmailSerializer, ResendVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer,
    InitialAdminSetupSerializer, SetupStatusSerializer,
)

# Custom Views & ViewSets

## Email Confirmation
class CustomConfirmEmailView(ConfirmEmailView):
    template_name = "account/email_confirm.html"

## JWT Authentication
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists and get profile
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(username=username)
            profile = user.profile

            # Check if account is locked
            if profile.is_account_locked:
                return Response(
                    {'detail': 'Account is temporarily locked due to too many failed login attempts. Try again later.'},
                    status=status.HTTP_423_LOCKED
                )

            # Check if user is active
            if not user.is_active:
                return Response(
                    {'detail': 'Account is not verified. Please check your email for verification link.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        except User.DoesNotExist:
            # Don't reveal if username exists for security
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Profile.DoesNotExist:
            return Response(
                {'detail': 'Profile not found. Please contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Authenticate user
        user = authenticate(username=username, password=password)
        if user is None:
            # Increment failed login attempts
            profile.increment_failed_login()
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Reset failed login attempts on successful login
        profile.reset_failed_login()

        # Proceed with token generation
        response = super().post(request, *args, **kwargs)

        # Add user data to response
        if response.status_code == 200:
            response.data['user'] = UserSerializer(user).data

        return response

## Google Social Login
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class  = OAuth2Client

## User Endpoints
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':    UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    serializer = VerifyEmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'detail': 'Email verified.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    serializer = ResendVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'detail': 'Verification email resent.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'detail': 'Password reset email sent.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'detail': 'Password has been reset.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    return Response(UserSerializer(request.user).data)


## Profile Endpoint
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [parsers.MultiPartParser, parsers.FormParser]
    http_method_names  = ['get', 'patch']

    def get(self, request):
        try:
            return Response(UserSerializer(request.user).data)
        except Exception:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)


## ONE-TIME SETUP WIZARD - Initial Admin Creation
@api_view(['GET'])
@permission_classes([AllowAny])
def setup_status(request):
    """
    Check if initial setup is required.
    Returns whether admin setup is needed based on existing admin count.
    """
    User = get_user_model()
    admin_count = Profile.objects.filter(role='admin').count()
    
    setup_required = admin_count == 0
    
    if setup_required:
        message = "Initial setup required. No admin accounts exist."
    else:
        message = f"System already has {admin_count} admin(s). Setup not required."
    
    return Response({
        'setup_required': setup_required,
        'existing_admin_count': admin_count,
        'message': message
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def setup_initialize(request):
    """
    Initialize the system with the first admin account.
    Only works when NO admin exists in the system.
    """
    User = get_user_model()
    
    # Check if any admin already exists
    admin_count = Profile.objects.filter(role='admin').count()
    if admin_count > 0:
        return Response({
            'detail': 'System is already set up. Admin accounts already exist.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Validate input
    serializer = InitialAdminSetupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Create admin user
    user = serializer.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'detail': 'Admin account created successfully!',
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'message': 'Welcome! You are now the system administrator.'
    }, status=status.HTTP_201_CREATED)

    def patch(self, request):
        try:
            # Handle user basic fields
            user_data = {}
            profile_data = {}
            preferences_data = {}

            # Separate data by model
            for key, value in request.data.items():
                if key in ['first_name', 'last_name', 'email']:
                    user_data[key] = value
                elif key in ['bio', 'location', 'phone_number', 'profile_visibility', 'skills', 'achievements', 'teaching_subjects']:
                    profile_data[key] = value
                elif key in ['language', 'timezone', 'email_notifications', 'push_notifications',
                           'study_reminders', 'course_updates', 'achievement_notifications',
                           'weekly_study_goal', 'preferred_study_time', 'learning_style',
                           'show_learning_progress', 'show_achievements', 'allow_profile_views']:
                    preferences_data[key] = value
                elif key == 'profile_image':
                    profile_data[key] = value

            # Update user
            if user_data:
                user_serializer = UserSerializer(request.user, data=user_data, partial=True)
                if not user_serializer.is_valid():
                    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                user_serializer.save()

            # Update profile
            if profile_data:
                profile_serializer = ProfileSerializer(request.user.profile, data=profile_data, partial=True)
                if not profile_serializer.is_valid():
                    return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                profile_serializer.save()

            # Update preferences
            if preferences_data:
                preferences_serializer = UserPreferencesSerializer(request.user.preferences, data=preferences_data, partial=True)
                if not preferences_serializer.is_valid():
                    return Response(preferences_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                preferences_serializer.save()

            return Response(UserSerializer(request.user).data)

        except Exception as e:
            return Response({'detail': f'Update failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


## Enhanced Profile Endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_preferences(request):
    """Get user's preferences and settings"""
    serializer = UserPreferencesSerializer(request.user.preferences)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_preferences(request):
    """Update user's preferences and settings"""
    serializer = UserPreferencesSerializer(request.user.preferences, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_learning_data(request):
    """Get user's learning progress and achievements"""
    profile = request.user.profile

    # Mock learning data - will be replaced with real course data
    learning_data = {
        'enrolled_courses_count': profile.enrolled_courses_count,
        'completed_courses_count': profile.completed_courses_count,
        'skills': profile.skills or [],
        'achievements': profile.achievements or [],
        'learning_streak': 0,  # Will be calculated from actual course data
        'total_study_time': 0,  # Will be calculated from actual progress data
        'average_progress': 0,  # Will be calculated from enrollments
        'recent_achievements': [],  # Recent course completions, badges, etc.
        'upcoming_deadlines': []  # Course deadlines, assignments
    }

    # Try to get real course data if available
    try:
        from courses.models import Enrollment
        enrollments = Enrollment.objects.filter(student=request.user).select_related('course')

        total_progress = 0
        completed_count = 0
        recent_completions = []

        for enrollment in enrollments:
            total_progress += enrollment.progress_percentage
            if enrollment.status == 'completed':
                completed_count += 1
                if enrollment.completed_at:
                    recent_completions.append({
                        'title': enrollment.course.title,
                        'completed_at': enrollment.completed_at,
                        'type': 'course_completion'
                    })

        learning_data.update({
            'enrolled_courses_count': enrollments.count(),
            'completed_courses_count': completed_count,
            'average_progress': total_progress / enrollments.count() if enrollments else 0,
            'recent_achievements': recent_completions[:5]  # Last 5 completions
        })

    except ImportError:
        # Courses app not available yet
        pass

    return Response(learning_data)


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


## Admin Invitation System (Magic Links)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_admin_invitation(request):
    """
    Send admin/instructor invitation email (admin only)
    """
    if not request.user.profile.is_admin:
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    email = request.data.get('email')
    role = request.data.get('role', 'instructor')

    if not email:
        return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    if role not in ['instructor', 'admin']:
        return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if invitation already exists and is valid
    existing_invitation = AdminInvitation.objects.filter(
        email=email,
        used=False,
        expires__gt=timezone.now()
    ).first()

    if existing_invitation:
        return Response({'detail': 'Invitation already sent to this email'}, status=status.HTTP_400_BAD_REQUEST)

    # Create invitation
    invitation = AdminInvitation.objects.create(
        email=email,
        role=role,
        invited_by=request.user
    )

    # Send invitation email
    try:
        invitation_url = f"{settings.FRONTEND_URL}/accept-invitation/{invitation.token}"
        subject = f"You're invited to join Do-It as {role.title()}"
        message = render_to_string('emails/admin_invitation.html', {
            'invitation': invitation,
            'invitation_url': invitation_url,
            'role': role.title(),
            'invited_by': request.user.get_full_name() or request.user.username
        })

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=message
        )

        return Response({
            'detail': f'Invitation sent to {email}',
            'invitation_id': invitation.id
        })

    except Exception as e:
        invitation.delete()  # Clean up on failure
        return Response({'detail': 'Failed to send invitation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def accept_admin_invitation(request, token):
    """
    Accept admin invitation and create account (magic link)
    """
    try:
        invitation = AdminInvitation.objects.get(token=token)
    except AdminInvitation.DoesNotExist:
        return Response({'detail': 'Invalid invitation'}, status=status.HTTP_400_BAD_REQUEST)

    if not invitation.is_valid():
        return Response({'detail': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user already exists
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user = User.objects.get(email=invitation.email)
        # User exists, just update their role
        invitation.accept(user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': f'Welcome back! Your role has been updated to {invitation.role}',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'redirect': '/admin' if invitation.role in ['admin', 'instructor'] else '/dashboard'
        })
    except User.DoesNotExist:
        # Create new user account
        username = invitation.email.split('@')[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Create user with temporary password (they can change it later)
        temp_password = User.objects.make_random_password()
        user = User.objects.create_user(
            username=username,
            email=invitation.email,
            password=temp_password,
            first_name='',
            last_name='',
            is_active=True
        )

        # Accept invitation (sets role)
        invitation.accept(user)

        # Auto-login the user
        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': f'Account created! Welcome to Do-It as {invitation.role}',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'redirect': '/admin' if invitation.role in ['admin', 'instructor'] else '/dashboard'
        })


## Enrollment Management (for future integration with Courses app)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_enrollments(request):
    """Get user's course enrollments (placeholder for Courses app integration)"""
    # This will be implemented when Courses app is ready
    return Response({
        'enrollments': [],
        'message': 'Enrollments will be available once Courses app is implemented'
    })


## Admin User Management
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

    def patch(self, request):
        try:
            user_serializer    = UserSerializer(request.user, data=request.data, partial=True)
            profile_serializer = None

            if 'profile_image' in request.data or 'phone_number' in request.data:
                profile = getattr(request.user, 'profile', None) or Profile.objects.create(user=request.user)
                profile_serializer = ProfileSerializer(profile, data=request.data, partial=True)

            if user_serializer.is_valid() and (not profile_serializer or profile_serializer.is_valid()):
                user_serializer.save()
                if profile_serializer:
                    profile_serializer.save()
                return Response(user_serializer.data)

            errors = user_serializer.errors
            if profile_serializer and profile_serializer.errors:
                errors.update(profile_serializer.errors)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)


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
    
    return Response({
        'total_users': total_users,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'active_enrollments': active_enrollments,
        'completed_enrollments': completed_enrollments,
        'completion_rate': round(completion_rate, 2),
        'total_revenue': float(total_revenue),
        'recent_enrollments': EnrollmentSerializer(recent_enrollments, many=True).data,
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
