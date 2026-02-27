from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from core.pagination import StandardResultsSetPagination

from .models import (
    LessonProgress, QuizSubmission, AssignmentSubmission,
    StudentAnalytics, QuizQuestion, QuizAnswer, AssignmentRequirement
)
from courses.models import Course, Module, Lesson, Enrollment
from .serializers import (
    LessonProgressSerializer, QuizSubmissionSerializer, AssignmentSubmissionSerializer,
    StudentAnalyticsSerializer, QuizQuestionSerializer, QuizAnswerSerializer,
    AssignmentRequirementSerializer, ProgressSummarySerializer,
    InstructorAnalyticsSerializer, GradingSerializer
)
from .services import ProgressAnalyticsService


class LessonProgressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LessonProgressSerializer

    def get_queryset(self):
        user = self.request.user
        base_queryset = LessonProgress.objects.select_related('student', 'lesson__module__course')
        if user.profile.is_instructor and not user.profile.is_admin:
            return base_queryset.filter(lesson__module__course__instructor=user)
        elif user.profile.is_admin:
            return base_queryset.all()
        else:
            return base_queryset.filter(student=user)

    def create(self, request, *args, **kwargs):
        lesson_id = request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        if not self._can_access_lesson(request.user, lesson):
            return Response({'detail': 'Cannot access this lesson'}, status=status.HTTP_403_FORBIDDEN)
        existing_progress = LessonProgress.objects.filter(student=request.user, lesson=lesson).first()
        if existing_progress:
            existing_progress.status = 'completed'
            existing_progress.completed_at = timezone.now()
            existing_progress.last_accessed = timezone.now()
            existing_progress.save()
            self._update_student_analytics(request.user, lesson.module.course)
            serializer = self.get_serializer(existing_progress)
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress = serializer.save(student=request.user, lesson=lesson, first_accessed=timezone.now(), last_accessed=timezone.now())
        if request.data.get('status') == 'completed':
            progress.status = 'completed'
            progress.completed_at = timezone.now()
            progress.save()
            self._update_student_analytics(request.user, lesson.module.course)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        progress = self.get_object()
        user = request.user
        if not (progress.student == user or (user.profile.is_instructor and progress.lesson.module.course.instructor == user) or user.profile.is_admin):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        progress_data = request.data.copy()
        progress_data['last_accessed'] = timezone.now()
        if 'time_spent_seconds' in progress_data:
            progress.time_spent_seconds = (progress.time_spent_seconds or 0) + progress_data['time_spent_seconds']
        if 'status' in progress_data:
            progress.status = progress_data['status']
            if progress_data['status'] == 'completed' and not progress.completed_at:
                progress.completed_at = timezone.now()
        if 'progress_percentage' in progress_data:
            progress.progress_percentage = progress_data['progress_percentage']
        progress.save()
        self._update_student_analytics(progress.student, progress.lesson.module.course)
        serializer = self.get_serializer(progress)
        return Response(serializer.data)

    def _can_access_lesson(self, user, lesson):
        if lesson.module.course.status != 'published' and not self._can_manage_course(user, lesson.module.course):
            return False
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrollment = Enrollment.objects.filter(student=user, course=lesson.module.course, status__in=['active', 'completed']).exists()
            if not enrollment:
                return False
        return True

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin

    def _update_student_analytics(self, student, course):
        analytics, created = StudentAnalytics.objects.get_or_create(student=student, course=course, defaults={'last_activity': timezone.now()})
        progress_records = LessonProgress.objects.filter(student=student, lesson__module__course=course)
        analytics.lessons_completed = progress_records.filter(status='completed').count()
        analytics.total_time_spent = progress_records.aggregate(total=Sum('time_spent_seconds'))['total'] or 0
        total_lessons = course.total_lessons
        if total_lessons > 0:
            analytics.completion_percentage = (analytics.lessons_completed / total_lessons) * 100
        scored_progress = progress_records.exclude(score__isnull=True)
        if scored_progress.exists():
            analytics.average_score = scored_progress.aggregate(avg=Avg('score'))['avg']
        analytics.last_activity = timezone.now()
        analytics.save()


class QuizSubmissionViewSet(viewsets.ModelViewSet):
    queryset = QuizSubmission.objects.select_related('student', 'lesson__module__course')
    permission_classes = [IsAuthenticated]
    serializer_class = QuizSubmissionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.profile.is_instructor and not user.profile.is_admin:
            return QuizSubmission.objects.filter(lesson__module__course__instructor=user)
        elif user.profile.is_admin:
            return QuizSubmission.objects.all()
        else:
            return QuizSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        if not self._can_access_lesson(self.request.user, lesson):
            raise serializers.ValidationError("Cannot access this lesson")
        if lesson.content_type != 'quiz':
            raise serializers.ValidationError("This lesson is not a quiz")
        existing_submissions = QuizSubmission.objects.filter(student=self.request.user, lesson=lesson).count()
        serializer.save(student=self.request.user, lesson=lesson, attempt_number=existing_submissions + 1)

    def _can_access_lesson(self, user, lesson):
        if lesson.module.course.status != 'published' and not self._can_manage_course(user, lesson.module.course):
            return False
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrollment = Enrollment.objects.filter(student=user, course=lesson.module.course, status__in=['active', 'completed']).exists()
            if not enrollment:
                return False
        return True

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.select_related('student', 'lesson__module__course')
    permission_classes = [IsAuthenticated]
    serializer_class = AssignmentSubmissionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.profile.is_instructor and not user.profile.is_admin:
            return AssignmentSubmission.objects.filter(lesson__module__course__instructor=user)
        elif user.profile.is_admin:
            return AssignmentSubmission.objects.all()
        else:
            return AssignmentSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        if not self._can_access_lesson(self.request.user, lesson):
            raise serializers.ValidationError("Cannot access this lesson")
        if lesson.content_type != 'assignment':
            raise serializers.ValidationError("This lesson is not an assignment")
        existing_submission = AssignmentSubmission.objects.filter(student=self.request.user, lesson=lesson).first()
        if existing_submission:
            raise serializers.ValidationError("Assignment already submitted")
        serializer.save(student=self.request.user, lesson=lesson)

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        submission = self.get_object()
        user = request.user
        if not ((user.profile.is_instructor and submission.lesson.module.course.instructor == user) or user.profile.is_admin):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        serializer = GradingSerializer(data=request.data)
        if serializer.is_valid():
            submission.score = serializer.validated_data['score']
            submission.max_score = serializer.validated_data['max_score']
            submission.percentage = (submission.score / submission.max_score * 100) if submission.max_score > 0 else 0
            submission.passed = submission.percentage >= 70
            submission.instructor_feedback = serializer.validated_data.get('feedback', '')
            submission.grade = serializer.validated_data.get('grade')
            submission.graded_at = timezone.now()
            submission.save()
            return Response({'detail': 'Assignment graded successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _can_access_lesson(self, user, lesson):
        if lesson.module.course.status != 'published' and not self._can_manage_course(user, lesson.module.course):
            return False
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrollment = Enrollment.objects.filter(student=user, course=lesson.module.course, status__in=['active', 'completed']).exists()
            if not enrollment:
                return False
        return True

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class QuizQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for quiz questions (instructor only)"""
    queryset = QuizQuestion.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.profile.is_instructor and not user.profile.is_admin:
            return QuizQuestion.objects.none()
        if user.profile.is_instructor and not user.profile.is_admin:
            return QuizQuestion.objects.filter(lesson__module__course__instructor=user)
        return QuizQuestion.objects.all()

    def perform_create(self, serializer):
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)
        if not self._can_manage_course(self.request.user, lesson.module.course):
            raise serializers.ValidationError("Cannot add questions to this lesson")
        serializer.save(lesson=lesson)

    @action(detail=True, methods=['post', 'get'])
    def answers(self, request, pk=None):
        """Handle quiz answers for a question"""
        question = self.get_object()
        if request.method == 'POST':
            serializer = QuizAnswerSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(question=question)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        answers = question.answers.all()
        serializer = QuizAnswerSerializer(answers, many=True)
        return Response(serializer.data)

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_progress_dashboard(request):
    user = request.user
    if not user.profile.is_student:
        return Response({'detail': 'Only students can access this dashboard'}, status=status.HTTP_403_FORBIDDEN)
    progress_data = ProgressAnalyticsService.get_student_progress_data(user)
    serializer = ProgressSummarySerializer(progress_data, many=True)
    return Response({'courses': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_analytics_dashboard(request):
    user = request.user
    if not user.profile.is_instructor and not user.profile.is_admin:
        return Response({'detail': 'Only instructors can access this dashboard'}, status=status.HTTP_403_FORBIDDEN)
    analytics_data = ProgressAnalyticsService.get_instructor_analytics_data(user)
    serializer = InstructorAnalyticsSerializer(analytics_data, many=True)
    return Response({'courses': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_content(request):
    user = request.user
    lesson_id = request.data.get('lesson_id')
    if not lesson_id:
        return Response({'detail': 'lesson_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    lesson = get_object_or_404(Lesson, id=lesson_id)
    enrollment = Enrollment.objects.filter(student=user, course=lesson.module.course, status__in=['active', 'completed']).first()
    if not enrollment:
        return Response({'detail': 'Not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)
    can_access = True
    unlock_reason = "Content unlocked"
    if lesson.module.is_locked:
        previous_modules = lesson.module.course.modules.filter(order__lt=lesson.module.order)
        for prev_module in previous_modules:
            prev_completion = LessonProgress.objects.filter(student=user, lesson__module=prev_module, status='completed').count()
            prev_total = prev_module.lessons.count()
            if prev_completion < prev_total:
                can_access = False
                unlock_reason = f"Complete all lessons in {prev_module.title} first"
                break
    return Response({'can_access': can_access, 'unlock_reason': unlock_reason, 'lesson_id': lesson_id})