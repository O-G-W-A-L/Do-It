from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg
from django.utils import timezone
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Course, Module, Lesson, Enrollment, CourseReview
from .serializers import (
    CourseSerializer, CourseListSerializer, CourseCreateSerializer,
    ModuleSerializer, LessonSerializer, EnrollmentSerializer, CourseReviewSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for course management - instructors can CRUD, students can read
    """
    queryset = Course.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.all()

        # Filter by status for non-instructors
        if not user.profile.is_instructor and not user.profile.is_admin:
            queryset = queryset.filter(status='published')

        # Instructors can only see their own courses (unless admin)
        if user.profile.is_instructor and not user.profile.is_admin:
            queryset = queryset.filter(instructor=user)

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CourseCreateSerializer
        elif self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        """Ensure instructor is assigned correctly"""
        serializer.save(instructor=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a course (instructor only)"""
        course = self.get_object()

        if course.instructor != request.user and not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if not course.description:
            return Response({'detail': 'Course must have a description to be published'},
                          status=status.HTTP_400_BAD_REQUEST)

        course.status = 'published'
        course.published_at = timezone.now()
        course.save()

        return Response({'detail': 'Course published successfully'})

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a course (instructor only)"""
        course = self.get_object()

        if course.instructor != request.user and not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        course.status = 'draft'
        course.save()

        return Response({'detail': 'Course unpublished successfully'})

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """Enroll student in course"""
        course = self.get_object()
        user = request.user

        if not user.profile.is_student:
            return Response({'detail': 'Only students can enroll in courses'},
                          status=status.HTTP_403_FORBIDDEN)

        # Check if already enrolled
        if Enrollment.objects.filter(student=user, course=course).exists():
            return Response({'detail': 'Already enrolled in this course'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Check course capacity
        if course.max_students and course.enrollment_count >= course.max_students:
            return Response({'detail': 'Course is full'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if course is published
        if course.status != 'published':
            return Response({'detail': 'Course is not available for enrollment'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Create enrollment
        enrollment = Enrollment.objects.create(
            student=user,
            course=course,
            amount_paid=0 if course.is_free else course.price
        )

        # Update user profile counters
        user.profile.enrolled_courses_count += 1
        user.profile.save()

        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get course reviews"""
        course = self.get_object()
        reviews = course.reviews.all()
        serializer = CourseReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Add or update course review (students only)"""
        course = self.get_object()
        user = request.user

        if not user.profile.is_student:
            return Response({'detail': 'Only students can review courses'},
                          status=status.HTTP_403_FORBIDDEN)

        # Check if enrolled and completed
        enrollment = Enrollment.objects.filter(
            student=user, course=course, status='completed'
        ).first()

        if not enrollment:
            return Response({'detail': 'Must complete course to leave a review'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Check if review already exists
        review, created = CourseReview.objects.get_or_create(
            student=user,
            course=course,
            defaults={
                'rating': request.data.get('rating'),
                'review_text': request.data.get('review_text', ''),
                'is_anonymous': request.data.get('is_anonymous', False)
            }
        )

        if not created:
            # Update existing review
            review.rating = request.data.get('rating', review.rating)
            review.review_text = request.data.get('review_text', review.review_text)
            review.is_anonymous = request.data.get('is_anonymous', review.is_anonymous)
            review.save()

        serializer = CourseReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ModuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for module management within courses
    """
    queryset = Module.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ModuleSerializer

    def get_queryset(self):
        user = self.request.user
        course_id = self.request.query_params.get('course')

        if course_id:
            course = get_object_or_404(Course, id=course_id)
            # Check permissions
            if not self._can_access_course(user, course):
                return Module.objects.none()
            return course.modules.all()

        # Return modules for courses user can access
        if user.profile.is_instructor and not user.profile.is_admin:
            return Module.objects.filter(course__instructor=user)
        elif user.profile.is_admin:
            return Module.objects.all()
        else:
            # Students can see modules from enrolled courses
            enrolled_course_ids = Enrollment.objects.filter(
                student=user, status__in=['active', 'completed']
            ).values_list('course_id', flat=True)
            return Module.objects.filter(course_id__in=enrolled_course_ids)

    def perform_create(self, serializer):
        """Ensure module belongs to user's course"""
        course_id = self.request.data.get('course')
        course = get_object_or_404(Course, id=course_id)

        if not self._can_manage_course(self.request.user, course):
            raise serializers.ValidationError("Cannot add modules to this course")

        serializer.save(course=course)

    def _can_access_course(self, user, course):
        """Check if user can access course content"""
        if course.status != 'published' and not self._can_manage_course(user, course):
            return False
        return True

    def _can_manage_course(self, user, course):
        """Check if user can manage course"""
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lesson management within modules
    """
    queryset = Lesson.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = LessonSerializer

    def get_queryset(self):
        user = self.request.user
        module_id = self.request.query_params.get('module')

        if module_id:
            module = get_object_or_404(Module, id=module_id)
            # Check course access
            if not self._can_access_course(user, module.course):
                return Lesson.objects.none()
            return module.lessons.all()

        # Return lessons for modules user can access
        if user.profile.is_instructor and not user.profile.is_admin:
            return Lesson.objects.filter(module__course__instructor=user)
        elif user.profile.is_admin:
            return Lesson.objects.all()
        else:
            # Students can see lessons from enrolled courses
            enrolled_course_ids = Enrollment.objects.filter(
                student=user, status__in=['active', 'completed']
            ).values_list('course_id', flat=True)
            return Lesson.objects.filter(module__course_id__in=enrolled_course_ids)

    def perform_create(self, serializer):
        """Ensure lesson belongs to user's module"""
        module_id = self.request.data.get('module')
        module = get_object_or_404(Module, id=module_id)

        if not self._can_manage_course(self.request.user, module.course):
            raise serializers.ValidationError("Cannot add lessons to this module")

        serializer.save(module=module)

    def _can_access_course(self, user, course):
        """Check if user can access course content"""
        if course.status != 'published' and not self._can_manage_course(user, course):
            return False
        return True

    def _can_manage_course(self, user, course):
        """Check if user can manage course"""
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for enrollment management (read-only for students, full access for instructors)
    """
    queryset = Enrollment.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user

        if user.profile.is_admin:
            return Enrollment.objects.all()
        elif user.profile.is_instructor:
            # Instructors can see enrollments in their courses
            return Enrollment.objects.filter(course__instructor=user)
        else:
            # Students can only see their own enrollments
            return Enrollment.objects.filter(student=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    """Get student's enrolled courses with progress"""
    user = request.user

    if not user.profile.is_student:
        return Response({'detail': 'Only students can access dashboard'},
                      status=status.HTTP_403_FORBIDDEN)

    enrollments = Enrollment.objects.filter(
        student=user, status__in=['active', 'completed']
    ).select_related('course', 'current_module', 'current_lesson')

    data = []
    for enrollment in enrollments:
        course_data = {
            'id': enrollment.course.id,
            'title': enrollment.course.title,
            'slug': enrollment.course.slug,
            'thumbnail': enrollment.course.thumbnail.url if enrollment.course.thumbnail else None,
            'instructor_name': enrollment.course.instructor.get_full_name(),
            'level': enrollment.course.level,
            'duration_weeks': enrollment.course.duration_weeks,
            'status': enrollment.status,
            'enrolled_at': enrollment.enrolled_at,
            'progress_percentage': enrollment.progress_percentage,
            'current_module': enrollment.current_module.title if enrollment.current_module else None,
            'current_lesson': enrollment.current_lesson.title if enrollment.current_lesson else None,
            'last_accessed': enrollment.last_accessed,
        }
        data.append(course_data)

    return Response({'courses': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_dashboard(request):
    """Get instructor's courses with statistics"""
    user = request.user

    if not user.profile.is_instructor and not user.profile.is_admin:
        return Response({'detail': 'Only instructors can access this dashboard'},
                      status=status.HTTP_403_FORBIDDEN)

    courses = Course.objects.filter(instructor=user) if not user.profile.is_admin else Course.objects.all()
    courses = courses.prefetch_related('modules', 'reviews', 'enrollments')

    data = []
    for course in courses:
        course_data = {
            'id': course.id,
            'title': course.title,
            'slug': course.slug,
            'status': course.status,
            'level': course.level,
            'enrollment_count': course.enrollment_count,
            'completion_rate': course.completion_rate,
            'average_rating': course.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0,
            'modules_count': course.modules.count(),
            'total_lessons': course.total_lessons,
            'published_at': course.published_at,
            'created_at': course.created_at,
        }
        data.append(course_data)

    return Response({'courses': data})
