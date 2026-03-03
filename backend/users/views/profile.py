from rest_framework import status, parsers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import UserSerializer, ProfileSerializer, UserPreferencesSerializer


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