from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from allauth.account.views import ConfirmEmailView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from ..models import Profile
from ..serializers import (
    UserSerializer,
    RegisterSerializer, VerifyEmailSerializer, ResendVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer,
    InitialAdminSetupSerializer, SetupStatusSerializer,
)


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