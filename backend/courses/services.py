"""
Service layer for courses app.
Separates business logic from views for maintainability and testability.
"""
from django.db import transaction
from django.db.models import F

from courses.models import Course, Enrollment, Module, Lesson
from users.models import Profile

# Import centralized constants
from core.constants import SecurityConstants, UploadConstants


class EnrollmentService:
    """
    Service handling course enrollment business logic.
    All enrollment rules in one place - easy to test and maintain.
    """
    
    @staticmethod
    def can_enroll(user, course):
        """
        Check all enrollment prerequisites.
        Returns (can_enroll: bool, error: str or None)
        """
        # Check user is student
        if not user.profile.is_student:
            return False, "Only students can enroll in courses"
        
        # Check course is published
        if course.status != 'published':
            return False, "Course is not available for enrollment"
        
        # Check course capacity
        if course.max_students and course.enrollment_count >= course.max_students:
            return False, "Course is full"
        
        # Check not already enrolled
        if Enrollment.objects.filter(student=user, course=course).exists():
            return False, "Already enrolled in this course"
        
        return True, None
    
    @staticmethod
    @transaction.atomic
    def enroll(user, course):
        """
        Execute enrollment with full transaction safety.
        Returns (enrollment: Enrollment or None, error: str or None)
        """
        # First check
        can_enroll, error = EnrollmentService.can_enroll(user, course)
        if not can_enroll:
            return None, error
        
        # Atomic enrollment with locking
        try:
            with transaction.atomic():
                # Double-check with lock
                if Enrollment.objects.select_for_update().filter(
                    student=user, course=course
                ).exists():
                    return None, "Already enrolled in this course"
                
                # Create enrollment
                enrollment = Enrollment.objects.create(
                    student=user,
                    course=course,
                    amount_paid=0 if course.is_free else course.price
                )
                
                # Atomic counter update
                Profile.objects.filter(user=user).update(
                    enrolled_courses_count=F('enrolled_courses_count') + 1
                )
                
                return enrollment, None
                
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def get_enrollment_details(user, course):
        """Get detailed enrollment info with progress."""
        try:
            enrollment = Enrollment.objects.select_related('course').get(
                student=user, course=course
            )
            
            # Get progress stats
            total_lessons = Lesson.objects.filter(
                module__course=course
            ).count()
            
            # This would call ProgressService in real implementation
            completed_lessons = 0  # Placeholder
            
            return {
                'enrollment': enrollment,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percent': (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            }
        except Enrollment.DoesNotExist:
            return None


class CourseService:
    """
    Service for course-related business logic.
    """
    
    @staticmethod
    def get_course_with_enrollment(course, user):
        """Get course with user's enrollment status."""
        data = {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'price': course.price,
            'is_free': course.is_free,
            'status': course.status,
            'enrollment_count': course.enrollment_count,
            'is_enrolled': False
        }
        
        if user.is_authenticated:
            data['is_enrolled'] = Enrollment.objects.filter(
                student=user, course=course
            ).exists()
        
        return data
    
    @staticmethod
    def validate_thumbnail(file):
        """Validate thumbnail file."""
        # Use centralized constants
        max_size = UploadConstants.MAX_THUMBNAIL_SIZE_MB * 1024 * 1024
        
        if file.content_type not in UploadConstants.ALLOWED_IMAGE_TYPES:
            return False, "Invalid image type"
        
        if file.size > max_size:
            return False, f"Image too large (max {UploadConstants.MAX_THUMBNAIL_SIZE_MB}MB)"
        
        return True, None


