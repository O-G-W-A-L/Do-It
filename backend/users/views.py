from django.utils import timezone
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import status, parsers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from allauth.account.views import ConfirmEmailView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from .models import Profile, EmailVerification, AdminInvitation
from .serializers import (
    UserSerializer, ProfileSerializer,
    RegisterSerializer, VerifyEmailSerializer, ResendVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer,
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
class UserManagementViewSet(ModelViewSet):
    """
    Admin viewset for managing users (full CRUD operations)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        # Only admins can access this
        if not self.request.user.profile.is_admin:
            return self.queryset.none()

        return self.queryset.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserSerializer  # Could create AdminUserSerializer if needed
        return UserSerializer

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role (admin only)"""
        if not request.user.profile.is_admin:
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
        if not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.is_active = not user.is_active
        user.save()

        status_text = 'activated' if user.is_active else 'deactivated'
        return Response({'detail': f'User account {status_text}'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics (admin only)"""
        if not request.user.profile.is_admin:
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
