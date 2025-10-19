# Django & Third-Party Imports
from django.utils import timezone
from django.db.models import Count, ObjectDoesNotExist

from rest_framework import viewsets, status, parsers
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

# Local Models & Serializers
from .models import (
    Profile, Task, Project, Routine, Goal,
    FileAttachment, Notification, Subtask,
)
from .serializers import (
    UserSerializer, ProfileSerializer,
    RegisterSerializer, VerifyEmailSerializer, ResendVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer,
    TaskSerializer, ProjectSerializer, RoutineSerializer,
    GoalSerializer, FileAttachmentSerializer, NotificationSerializer,
    SubtaskSerializer,
)

# Custom Views & ViewSets

## Email Confirmation 
class CustomConfirmEmailView(ConfirmEmailView):
    template_name = "account/email_confirm.html"

## JWT Authentication 
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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


## Task Insights 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insights(request):
    user = request.user
    now  = timezone.now()
    qs   = Task.objects.filter(user=user)

    total     = qs.count()
    completed = qs.filter(is_done=True).count()
    overdue   = qs.filter(is_done=False, due_date__lt=now).count()
    pending   = total - completed

    done_titles = (
        qs.filter(is_done=True)
          .values('title')
          .annotate(count=Count('id'))
          .filter(count__gte=3)
          .values_list('title', flat=True)
    )
    existing_routines   = set(Routine.objects.filter(user=user).values_list('title', flat=True))
    routine_suggestions = [t for t in done_titles if t not in existing_routines]

    return Response({
        'total':               total,
        'completed':           completed,
        'pending':             pending,
        'overdue':             overdue,
        'routine_suggestions': routine_suggestions,
    }, status=status.HTTP_200_OK)


## Profile Endpoint 
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        try:
            return Response(UserSerializer(request.user).data)
        except ObjectDoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

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

        except ObjectDoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)


## CRUD ViewSets 
class BaseUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class TaskViewSet(BaseUserViewSet):
    queryset         = Task.objects.none()
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('-due_date')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset         = Project.objects.all()
    serializer_class = ProjectSerializer


class RoutineViewSet(viewsets.ModelViewSet):
    queryset         = Routine.objects.all()
    serializer_class = RoutineSerializer


class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    queryset = Goal.objects.all()

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)



class FileAttachmentViewSet(viewsets.ModelViewSet):
    queryset         = FileAttachment.objects.all()
    serializer_class = FileAttachmentSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset         = Notification.objects.all()
    serializer_class = NotificationSerializer


class SubtaskViewSet(viewsets.ModelViewSet):
    """
    Subtasks filtered by parent task’s user.
    Added queryset for DRF router basename inference.
    """
    queryset           = Subtask.objects.none()
    serializer_class   = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.filter(task__user=self.request.user)
