from django.shortcuts import get_object_or_404
from django.db.models import Q, Max, Avg
from django.utils import timezone
from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

from .models import Course, Unit, Module, Lesson, Enrollment, CourseReview
from .serializers import (
    CourseSerializer, CourseListSerializer, CourseCreateSerializer,
    UnitSerializer, ModuleSerializer, LessonSerializer, EnrollmentSerializer, CourseReviewSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.all()
        if not user.is_authenticated:
            return queryset.filter(status='published').order_by('-created_at')
        if not user.profile.is_instructor and not user.profile.is_admin:
            enrolled_course_ids = Enrollment.objects.filter(
                student=user, status__in=['active', 'completed']
            ).values_list('course_id', flat=True)
            queryset = queryset.filter(
                Q(status='published') | Q(id__in=enrolled_course_ids)
            )
        if user.profile.is_instructor and not user.profile.is_admin:
            queryset = queryset.filter(instructor=user)
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CourseCreateSerializer
        elif self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        course = self.get_object()
        if course.instructor != request.user and not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        if not course.description:
            return Response({'detail': 'Course must have a description to be published'}, status=status.HTTP_400_BAD_REQUEST)
        course.status = 'published'
        course.published_at = timezone.now()
        course.save()
        return Response({'detail': 'Course published successfully'})

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        course = self.get_object()
        if course.instructor != request.user and not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        course.status = 'draft'
        course.save()
        return Response({'detail': 'Course unpublished successfully'})

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        from courses.services import EnrollmentService
        course = self.get_object()
        user = request.user
        enrollment, error = EnrollmentService.enroll(user, course)
        if error:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)
        serializer = EnrollmentSerializer(enrollment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        course = self.get_object()
        reviews = course.reviews.all()
        serializer = CourseReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        course = self.get_object()
        user = request.user
        if not user.profile.is_student:
            return Response({'detail': 'Only students can review courses'}, status=status.HTTP_403_FORBIDDEN)
        enrollment = Enrollment.objects.filter(student=user, course=course, status='completed').first()
        if not enrollment:
            return Response({'detail': 'Must complete course to leave a review'}, status=status.HTTP_400_BAD_REQUEST)
        review, created = CourseReview.objects.get_or_create(
            student=user, course=course,
            defaults={'rating': request.data.get('rating'), 'review_text': request.data.get('review_text', ''), 'is_anonymous': request.data.get('is_anonymous', False)}
        )
        if not created:
            review.rating = request.data.get('rating', review.rating)
            review.review_text = request.data.get('review_text', review.review_text)
            review.is_anonymous = request.data.get('is_anonymous', review.is_anonymous)
            review.save()
        serializer = CourseReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[parsers.MultiPartParser])
    def upload_thumbnail(self, request, pk=None):
        course = self.get_object()
        if course.instructor != request.user and not request.user.profile.is_admin:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        if 'thumbnail' not in request.FILES:
            return Response({'detail': 'No thumbnail file provided'}, status=status.HTTP_400_BAD_REQUEST)
        thumbnail_file = request.FILES['thumbnail']
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if thumbnail_file.content_type not in allowed_types:
            return Response({'detail': 'Invalid file type'}, status=status.HTTP_400_BAD_REQUEST)
        if thumbnail_file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File too large'}, status=status.HTTP_400_BAD_REQUEST)
        if course.thumbnail:
            try:
                if default_storage.exists(course.thumbnail.name):
                    default_storage.delete(course.thumbnail.name)
            except Exception:
                pass
        course.thumbnail = thumbnail_file
        course.save()
        serializer = self.get_serializer(course)
        return Response(serializer.data)


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UnitSerializer

    def get_queryset(self):
        user = self.request.user
        course_id = self.request.query_params.get('course')
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            if not self._can_access_course(user, course):
                return Unit.objects.none()
            return course.units.all()
        if user.profile.is_instructor and not user.profile.is_admin:
            return Unit.objects.filter(course__instructor=user)
        elif user.profile.is_admin:
            return Unit.objects.all()
        else:
            enrolled_course_ids = Enrollment.objects.filter(student=user, status__in=['active', 'completed']).values_list('course_id', flat=True)
            return Unit.objects.filter(course_id__in=enrolled_course_ids)

    def perform_create(self, serializer):
        course_id = self.request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        if not self._can_manage_course(self.request.user, course):
            raise serializers.ValidationError("Cannot add units to this course")
        serializer.save(course=course)

    def _can_access_course(self, user, course):
        if course.status != 'published' and not self._can_manage_course(user, course):
            return False
        return True

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ModuleSerializer

    def get_queryset(self):
        user = self.request.user
        course_id = self.request.query_params.get('course')
        if course_id:
            course = get_object_or_404(Course, id=course_id)
            if not self._can_access_course(user, course):
                return Module.objects.none()
            return course.modules.all()
        if user.profile.is_instructor and not user.profile.is_admin:
            return Module.objects.filter(course__instructor=user)
        elif user.profile.is_admin:
            return Module.objects.all()
        else:
            enrolled_course_ids = Enrollment.objects.filter(student=user, status__in=['active', 'completed']).values_list('course_id', flat=True)
            return Module.objects.filter(course_id__in=enrolled_course_ids)

    def perform_create(self, serializer):
        course_id = self.request.data.get('course')
        course = get_object_or_404(Course, id=course_id)
        if not self._can_manage_course(self.request.user, course):
            raise serializers.ValidationError("Cannot add modules to this course")
        if 'order' not in self.request.data or not self.request.data.get('order'):
            max_order = Module.objects.filter(course=course).aggregate(Max('order'))['order__max'] or 0
            serializer.save(course=course, order=max_order + 1)
        else:
            serializer.save(course=course)

    def _can_access_course(self, user, course):
        if course.status != 'published' and not self._can_manage_course(user, course):
            return False
        return True

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = LessonSerializer

    def get_queryset(self):
        user = self.request.user
        module_id = self.request.query_params.get('module')
        if module_id:
            module = get_object_or_404(Module, id=module_id)
            if not self._can_access_course(user, module.course):
                return Lesson.objects.none()
            return module.lessons.all()
        if user.profile.is_instructor and not user.profile.is_admin:
            return Lesson.objects.filter(module__course__instructor=user)
        elif user.profile.is_admin:
            return Lesson.objects.all()
        else:
            enrolled_course_ids = Enrollment.objects.filter(student=user, status__in=['active', 'completed']).values_list('course_id', flat=True)
            return Lesson.objects.filter(module__course_id__in=enrolled_course_ids)

    def perform_create(self, serializer):
        module_id = self.request.data.get('module')
        module = get_object_or_404(Module, id=module_id)
        if not self._can_manage_course(self.request.user, module.course):
            raise serializers.ValidationError("Cannot add lessons to this module")
        if 'order' not in self.request.data or not self.request.data.get('order'):
            max_order = Lesson.objects.filter(module=module).aggregate(Max('order'))['order__max'] or 0
            serializer.save(module=module, order=max_order + 1)
        else:
            serializer.save(module=module)

    def _can_access_course(self, user, course):
        if course.status != 'published' and not self._can_manage_course(user, course):
            return False
        return True

    def _can_manage_course(self, user, course):
        return (user.profile.is_instructor and course.instructor == user) or user.profile.is_admin


class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Enrollment.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.profile.is_admin:
            return Enrollment.objects.all()
        elif user.profile.is_instructor:
            return Enrollment.objects.filter(course__instructor=user)
        else:
            return Enrollment.objects.filter(student=user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    user = request.user
    if not user.profile.is_student:
        return Response({'detail': 'Only students can access dashboard'}, status=status.HTTP_403_FORBIDDEN)
    enrollments = Enrollment.objects.filter(student=user, status__in=['active', 'completed']).select_related('course', 'current_module', 'current_lesson')
    data = []
    for enrollment in enrollments:
        course_data = {
            'id': enrollment.course.id, 'title': enrollment.course.title, 'slug': enrollment.course.slug,
            'thumbnail': enrollment.course.thumbnail.url if enrollment.course.thumbnail else None,
            'instructor_name': enrollment.course.instructor.get_full_name(), 'level': enrollment.course.level,
            'duration_weeks': enrollment.course.duration_weeks, 'status': enrollment.status,
            'enrolled_at': enrollment.enrolled_at, 'progress_percentage': enrollment.progress_percentage,
            'current_module': enrollment.current_module.title if enrollment.current_module else None,
            'current_lesson': enrollment.current_lesson.title if enrollment.current_lesson else None,
            'last_accessed': enrollment.last_accessed,
        }
        data.append(course_data)
    return Response({'courses': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_dashboard(request):
    user = request.user
    if not user.profile.is_instructor and not user.profile.is_admin:
        return Response({'detail': 'Only instructors can access this dashboard'}, status=status.HTTP_403_FORBIDDEN)
    courses = Course.objects.filter(instructor=user) if not user.profile.is_admin else Course.objects.all()
    courses = courses.prefetch_related('modules', 'reviews', 'enrollments')
    data = []
    for course in courses:
        course_data = {
            'id': course.id, 'title': course.title, 'slug': course.slug, 'status': course.status,
            'level': course.level, 'enrollment_count': course.enrollment_count, 'completion_rate': course.completion_rate,
            'average_rating': course.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0,
            'modules_count': course.modules.count(), 'total_lessons': course.total_lessons,
            'published_at': course.published_at, 'created_at': course.created_at,
        }
        data.append(course_data)
    return Response({'courses': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_outline(request, course_id):
    """Get full course outline: Course -> Units -> Modules -> Lessons"""
    course = get_object_or_404(Course, id=course_id)
    user = request.user
    is_owner = course.instructor == user
    is_admin = hasattr(user, 'profile') and user.profile.is_admin
    is_enrolled = Enrollment.objects.filter(student=user, course=course, status__in=['active', 'completed']).exists()
    if not (is_owner or is_admin or is_enrolled):
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Simple approach - just iterate and build the tree
    units = course.units.order_by('order')
    outline = []
    for unit in units:
        unit_data = {'id': unit.id, 'title': unit.title, 'description': unit.description, 'order': unit.order, 'modules': []}
        modules = unit.modules.order_by('order')
        for module in modules:
            module_data = {'id': module.id, 'title': module.title, 'description': module.description, 'order': module.order, 'lessons': []}
            lessons = module.lessons.order_by('order')
            for lesson in lessons:
                lesson_data = {'id': lesson.id, 'title': lesson.title, 'order': lesson.order, 'content_type': lesson.content_type}
                if lesson.content_type == 'quiz':
                    lesson_data['quiz_info'] = {'has_content': bool(lesson.content), 'questions_count': len(lesson.content.get('questions', [])) if lesson.content else 0}
                module_data['lessons'].append(lesson_data)
            unit_data['modules'].append(module_data)
        outline.append(unit_data)
    
    return Response({'id': course.id, 'title': course.title, 'slug': course.slug, 'outline': outline})