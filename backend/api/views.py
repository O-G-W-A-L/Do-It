# views.py
from rest_framework import viewsets, status, parsers  # Import parsers here
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.account.views import ConfirmEmailView
from rest_framework.views import APIView
from rest_framework import serializers  # Import serializers
from django.db.models import ObjectDoesNotExist

from .models import Profile
from .serializers import UserSerializer, ProfileSerializer

from django.utils import timezone
from django.db.models import Count

from .models import (
    Task, Project, Routine, Goal,
    FileAttachment, Notification, Subtask,
)
from .serializers import (
    RegisterSerializer, VerifyEmailSerializer, ResendVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    CustomTokenObtainPairSerializer, UserSerializer,
    TaskSerializer, ProjectSerializer, RoutineSerializer,
    GoalSerializer, FileAttachmentSerializer, NotificationSerializer, SubtaskSerializer,
)

# Custom email confirmation view
class CustomConfirmEmailView(ConfirmEmailView):
    template_name = "account/email_confirm.html"


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)
    return Response(serializer.errors, status=400)


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


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def hello_world(request):
    return Response({'message': 'Hello, world!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    return Response(UserSerializer(request.user).data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.none()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('-due_date')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer errors on create:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]


class RoutineViewSet(viewsets.ModelViewSet):
    queryset = Routine.objects.all()
    serializer_class = RoutineSerializer
    permission_classes = [IsAuthenticated]


class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]


class FileAttachmentViewSet(viewsets.ModelViewSet):
    queryset = FileAttachment.objects.all()
    serializer_class = FileAttachmentSerializer
    permission_classes = [IsAuthenticated]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]


# ─── New Insights Endpoint ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insights(request):
    """
    Returns aggregated task insights for the authenticated user:
     - total tasks
     - completed tasks
     - pending tasks (not done)
     - overdue tasks
     - routine suggestions (titles completed >= 3 but not a routine)
    """
    user = request.user
    now = timezone.now()

    qs = Task.objects.filter(user=user)
    total    = qs.count()
    completed = qs.filter(is_done=True).count()
    overdue   = qs.filter(is_done=False, due_date__lt=now).count()
    pending   = total - completed

    # Titles completed >=3 times
    done_titles = (
        qs.filter(is_done=True)
          .values('title')
          .annotate(count=Count('id'))
          .filter(count__gte=3)
          .values_list('title', flat=True)
    )
    existing_routines = set(Routine.objects.filter(user=user).values_list('title', flat=True))
    routine_suggestions = [t for t in done_titles if t not in existing_routines]

    return Response({
        'total': total,
        'completed': completed,
        'pending': pending,
        'overdue': overdue,
        'routine_suggestions': routine_suggestions,
    }, status=status.HTTP_200_OK)

# ─── SUBTASK VIEWSET ───────────────────────────────────────────────────────────
class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.none()
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # only subtasks belonging to this user’s tasks
        return Subtask.objects.filter(task__user=self.request.user)
    
# user profile
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]  # Use imported parsers

    def get(self, request):
        try:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            user_serializer = UserSerializer(request.user, data=request.data, partial=True)
            profile_serializer = None

            if 'profile_image' in request.data or 'phone_number' in request.data:
                try:
                    profile = request.user.profile
                except ObjectDoesNotExist:
                    profile = Profile.objects.create(user=request.user)
                profile_serializer = ProfileSerializer(profile, data=request.data, partial=True)

            if user_serializer.is_valid() and (profile_serializer is None or profile_serializer.is_valid()):
                user_serializer.save()
                if profile_serializer:
                    profile_serializer.save()
                return Response(user_serializer.data)
            else:
                errors = user_serializer.errors
                if profile_serializer and profile_serializer.errors:
                    errors.update(profile_serializer.errors)
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)