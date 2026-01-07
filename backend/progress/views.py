from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

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


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class LessonProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lesson progress tracking
    """
    queryset = LessonProgress.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = LessonProgressSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_instructor and not user.profile.is_admin:
            # Instructors can see progress for their courses
            return LessonProgress.objects.filter(
                lesson__module__course__instructor=user
            )
        elif user.profile.is_admin:
            return LessonProgress.objects.all()
        else:
            # Students can only see their own progress
            return LessonProgress.objects.filter(student=user)

    def perform_create(self, serializer):
        """Ensure progress belongs to authenticated user"""
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # Check if user can access this lesson
        if not self._can_access_lesson(self.request.user, lesson):
            raise serializers.ValidationError("Cannot access this lesson")

        # Check if progress already exists
        existing_progress = LessonProgress.objects.filter(
            student=self.request.user, lesson=lesson
        ).first()

        if existing_progress:
            # Allow updating to 'completed' status for existing progress
            if self.request.data.get('status') == 'completed':
                existing_progress.status = 'completed'
                existing_progress.completed_at = timezone.now()
                existing_progress.last_accessed = timezone.now()
                existing_progress.save()

                # Update student analytics
                self._update_student_analytics(self.request.user, lesson.module.course)
                return existing_progress
            else:
                raise serializers.ValidationError("Progress already exists for this lesson")

        # Create progress record
        progress = serializer.save(
            student=self.request.user,
            lesson=lesson,
            first_accessed=timezone.now(),
            last_accessed=timezone.now()
        )

        # Handle completion if status is 'completed'
        if self.request.data.get('status') == 'completed':
            progress.status = 'completed'
            progress.completed_at = timezone.now()
            progress.save()

            # Update student analytics
            self._update_student_analytics(self.request.user, lesson.module.course)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update lesson progress"""
        progress = self.get_object()
        user = request.user

        # Only student who owns progress or instructor can update
        if not (progress.student == user or
                (user.profile.is_instructor and progress.lesson.module.course.instructor == user) or
                user.profile.is_admin):
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Update progress data
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

        # Update student analytics
        self._update_student_analytics(progress.student, progress.lesson.module.course)

        serializer = self.get_serializer(progress)
        return Response(serializer.data)

    def _can_access_lesson(self, user, lesson):
        """Check if user can access lesson"""
        if lesson.module.course.status != 'published' and not self._can_manage_course(user, lesson.module.course):
            return False

        # Check enrollment for students
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrollment = Enrollment.objects.filter(
                student=user, course=lesson.module.course, status__in=['active', 'completed']
            ).exists()
            if not enrollment:
                return False

        return True

    def _can_manage_course(self, user, course):
        """Check if user can manage course"""
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin

    def _update_student_analytics(self, student, course):
        """Update student analytics for course"""
        analytics, created = StudentAnalytics.objects.get_or_create(
            student=student, course=course,
            defaults={'last_activity': timezone.now()}
        )

        # Recalculate analytics
        progress_records = LessonProgress.objects.filter(
            student=student, lesson__module__course=course
        )

        analytics.lessons_completed = progress_records.filter(status='completed').count()
        analytics.total_time_spent = progress_records.aggregate(
            total=Sum('time_spent_seconds')
        )['total'] or 0

        # Calculate completion percentage
        total_lessons = course.total_lessons
        if total_lessons > 0:
            analytics.completion_percentage = (analytics.lessons_completed / total_lessons) * 100

        # Calculate average score
        scored_progress = progress_records.exclude(score__isnull=True)
        if scored_progress.exists():
            analytics.average_score = scored_progress.aggregate(
                avg=Avg('score')
            )['avg']

        analytics.last_activity = timezone.now()
        analytics.save()


class QuizSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quiz submissions
    """
    queryset = QuizSubmission.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = QuizSubmissionSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_instructor and not user.profile.is_admin:
            # Instructors can see submissions for their courses
            return QuizSubmission.objects.filter(
                lesson__module__course__instructor=user
            )
        elif user.profile.is_admin:
            return QuizSubmission.objects.all()
        else:
            # Students can only see their own submissions
            return QuizSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        """Create quiz submission for authenticated user"""
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # Check if user can access this lesson
        if not self._can_access_lesson(self.request.user, lesson):
            raise serializers.ValidationError("Cannot access this lesson")

        # Check if lesson is a quiz
        if lesson.content_type != 'quiz':
            raise serializers.ValidationError("This lesson is not a quiz")

        # Get attempt number
        existing_submissions = QuizSubmission.objects.filter(
            student=self.request.user, lesson=lesson
        ).count()

        serializer.save(
            student=self.request.user,
            lesson=lesson,
            attempt_number=existing_submissions + 1
        )

    def _can_access_lesson(self, user, lesson):
        """Check if user can access lesson"""
        if lesson.module.course.status != 'published' and not self._can_manage_course(user, lesson.module.course):
            return False

        # Check enrollment for students
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrollment = Enrollment.objects.filter(
                student=user, course=lesson.module.course, status__in=['active', 'completed']
            ).exists()
            if not enrollment:
                return False

        return True

    def _can_manage_course(self, user, course):
        """Check if user can manage course"""
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for assignment submissions
    """
    queryset = AssignmentSubmission.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = AssignmentSubmissionSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_instructor and not user.profile.is_admin:
            # Instructors can see submissions for their courses
            return AssignmentSubmission.objects.filter(
                lesson__module__course__instructor=user
            )
        elif user.profile.is_admin:
            return AssignmentSubmission.objects.all()
        else:
            # Students can only see their own submissions
            return AssignmentSubmission.objects.filter(student=user)

    def perform_create(self, serializer):
        """Create assignment submission for authenticated user"""
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)

        # Check if user can access this lesson
        if not self._can_access_lesson(self.request.user, lesson):
            raise serializers.ValidationError("Cannot access this lesson")

        # Check if lesson is an assignment
        if lesson.content_type != 'assignment':
            raise serializers.ValidationError("This lesson is not an assignment")

        # Check if already submitted
        existing_submission = AssignmentSubmission.objects.filter(
            student=self.request.user, lesson=lesson
        ).first()

        if existing_submission:
            raise serializers.ValidationError("Assignment already submitted")

        serializer.save(student=self.request.user, lesson=lesson)

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade assignment submission (instructor only)"""
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
        """Check if user can access lesson"""
        if lesson.module.course.status != 'published' and not self._can_manage_course(user, lesson.module.course):
            return False

        # Check enrollment for students
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrollment = Enrollment.objects.filter(
                student=user, course=lesson.module.course, status__in=['active', 'completed']
            ).exists()
            if not enrollment:
                return False

        return True

    def _can_manage_course(self, user, course):
        """Check if user can manage course"""
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class QuizQuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for quiz questions (instructor only)
    """
    queryset = QuizQuestion.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.profile.is_instructor and not user.profile.is_admin:
            return QuizQuestion.objects.none()

        if user.profile.is_instructor and not user.profile.is_admin:
            return QuizQuestion.objects.filter(lesson__module__course__instructor=user)
        else:
            return QuizQuestion.objects.all()

    def perform_create(self, serializer):
        """Ensure question belongs to instructor's course"""
        lesson_id = self.request.data.get('lesson')
        lesson = get_object_or_404(Lesson, id=lesson_id)

        if not self._can_manage_course(self.request.user, lesson.module.course):
            raise serializers.ValidationError("Cannot add questions to this lesson")

        serializer.save(lesson=lesson)

    def _can_manage_course(self, user, course):
        """Check if user can manage course"""
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_progress_dashboard(request):
    """Get student's progress across all enrolled courses"""
    user = request.user

    if not user.profile.is_student:
        return Response({'detail': 'Only students can access this dashboard'},
                      status=status.HTTP_403_FORBIDDEN)

    # Get all enrollments
    enrollments = Enrollment.objects.filter(
        student=user, status__in=['active', 'completed']
    ).select_related('course')

    progress_data = []

    for enrollment in enrollments:
        course = enrollment.course

        # Calculate progress metrics
        total_lessons = course.total_lessons
        completed_lessons = LessonProgress.objects.filter(
            student=user, lesson__module__course=course, status='completed'
        ).count()

        # Get current position
        current_progress = LessonProgress.objects.filter(
            student=user, lesson__module__course=course
        ).order_by('-last_accessed').first()

        current_module = current_progress.lesson.module.title if current_progress else None
        current_lesson = current_progress.lesson.title if current_progress else None

        # Calculate average score
        avg_score = LessonProgress.objects.filter(
            student=user, lesson__module__course=course
        ).exclude(score__isnull=True).aggregate(avg=Avg('score'))['avg']

        # Calculate time spent
        time_spent = LessonProgress.objects.filter(
            student=user, lesson__module__course=course
        ).aggregate(total=Sum('time_spent_seconds'))['total'] or 0
        time_spent_hours = time_spent / 3600

        # Next milestone
        completion_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        if completion_pct < 25:
            next_milestone = "25% Complete"
        elif completion_pct < 50:
            next_milestone = "50% Complete"
        elif completion_pct < 75:
            next_milestone = "75% Complete"
        elif completion_pct < 100:
            next_milestone = "Course Complete"
        else:
            next_milestone = None

        progress_summary = {
            'course_id': course.id,
            'course_title': course.title,
            'enrollment_date': enrollment.enrolled_at,
            'completion_percentage': round(completion_pct, 2),
            'lessons_completed': completed_lessons,
            'total_lessons': total_lessons,
            'current_module': current_module,
            'current_lesson': current_lesson,
            'average_score': round(avg_score, 2) if avg_score else None,
            'time_spent_hours': round(time_spent_hours, 1),
            'next_milestone': next_milestone
        }

        progress_data.append(progress_summary)

    serializer = ProgressSummarySerializer(progress_data, many=True)
    return Response({'courses': serializer.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_analytics_dashboard(request):
    """Get instructor's course analytics"""
    user = request.user

    if not user.profile.is_instructor and not user.profile.is_admin:
        return Response({'detail': 'Only instructors can access this dashboard'},
                      status=status.HTTP_403_FORBIDDEN)

    courses = Course.objects.filter(instructor=user) if not user.profile.is_admin else Course.objects.all()
    analytics_data = []

    for course in courses:
        # Basic enrollment stats
        enrollments = Enrollment.objects.filter(course=course)
        total_enrollments = enrollments.count()
        active_students = enrollments.filter(status='active').count()
        completed_students = enrollments.filter(status='completed').count()

        completion_rate = (completed_students / total_enrollments * 100) if total_enrollments > 0 else 0

        # Average scores
        avg_score = LessonProgress.objects.filter(
            lesson__module__course=course
        ).exclude(score__isnull=True).aggregate(avg=Avg('score'))['avg'] or 0

        # Quiz completion rate
        total_quizzes = Lesson.objects.filter(module__course=course, content_type='quiz').count()
        completed_quizzes = QuizSubmission.objects.filter(
            lesson__module__course=course, passed=True
        ).values('student').distinct().count()

        quiz_completion_rate = (completed_quizzes / total_enrollments * 100) if total_enrollments > 0 else 0

        # Assignment submission rate
        total_assignments = Lesson.objects.filter(module__course=course, content_type='assignment').count()
        submitted_assignments = AssignmentSubmission.objects.filter(
            lesson__module__course=course
        ).values('student').distinct().count()

        assignment_submission_rate = (submitted_assignments / total_enrollments * 100) if total_enrollments > 0 else 0

        # Drop-off analysis (simplified)
        drop_off_points = {
            'module_1_completion': 85,  # Mock data
            'module_2_completion': 65,
            'module_3_completion': 45
        }

        # Top performing lessons
        top_lessons = LessonProgress.objects.filter(
            lesson__module__course=course, status='completed'
        ).values('lesson__title').annotate(
            completion_count=Count('id')
        ).order_by('-completion_count')[:5]

        top_performing_lessons = [
            {'lesson': item['lesson__title'], 'completions': item['completion_count']}
            for item in top_lessons
        ]

        # Struggling students (low completion rates)
        struggling_students = enrollments.filter(
            progress_percentage__lt=30
        ).count()

        analytics_summary = {
            'course_id': course.id,
            'course_title': course.title,
            'total_enrollments': total_enrollments,
            'active_students': active_students,
            'completion_rate': round(completion_rate, 2),
            'average_score': round(avg_score, 2),
            'quiz_completion_rate': round(quiz_completion_rate, 2),
            'assignment_submission_rate': round(assignment_submission_rate, 2),
            'drop_off_points': drop_off_points,
            'top_performing_lessons': top_performing_lessons,
            'struggling_students_count': struggling_students
        }

        analytics_data.append(analytics_summary)

    serializer = InstructorAnalyticsSerializer(analytics_data, many=True)
    return Response({'courses': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_content(request):
    """Check and unlock content based on progress"""
    user = request.user
    lesson_id = request.data.get('lesson_id')

    if not lesson_id:
        return Response({'detail': 'lesson_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    lesson = get_object_or_404(Lesson, id=lesson_id)

    # Check if user can access this course
    enrollment = Enrollment.objects.filter(
        student=user, course=lesson.module.course, status__in=['active', 'completed']
    ).first()

    if not enrollment:
        return Response({'detail': 'Not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)

    # Check unlock criteria
    can_access = True
    unlock_reason = "Content unlocked"

    if lesson.module.is_locked:
        # Check if previous modules are completed
        previous_modules = lesson.module.course.modules.filter(order__lt=lesson.module.order)
        for prev_module in previous_modules:
            prev_completion = LessonProgress.objects.filter(
                student=user, lesson__module=prev_module, status='completed'
            ).count()

            prev_total = prev_module.lessons.count()
            if prev_completion < prev_total:
                can_access = False
                unlock_reason = f"Complete all lessons in {prev_module.title} first"
                break

    return Response({
        'can_access': can_access,
        'unlock_reason': unlock_reason,
        'lesson_id': lesson_id
    })
