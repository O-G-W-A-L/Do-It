from rest_framework import serializers
from django.utils import timezone
from .models import Course, Unit, Module, Lesson, Enrollment, CourseReview


class UnitSerializer(serializers.ModelSerializer):
    """Serializer for course units with nested modules"""
    modules = serializers.SerializerMethodField()
    course_title = serializers.CharField(source='course.title', read_only=True)
    modules_count = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'title', 'description', 'order', 'duration_weeks',
            'total_modules', 'course_title', 'modules_count', 'modules',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_modules']

    def get_modules(self, obj):
        """Get modules for this unit, ordered by order field"""
        modules = obj.modules.all().order_by('order')
        return ModuleSerializer(modules, many=True, context=self.context).data

    def get_modules_count(self, obj):
        return obj.modules.count()


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for individual lessons with content handling"""
    course_title = serializers.CharField(source='module.course.title', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'order', 'content_type', 
            'lesson_type', 'weight',  # Doit lesson classification
            'content', 'video_url', 'video_duration', 'attachments', 'is_required',
            'estimated_duration', 'tags', 'difficulty', 'course_title',
            'module_title', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Validate lesson content based on type"""
        content_type = attrs.get('content_type', self.instance.content_type if self.instance else 'text')

        if content_type == 'quiz' and not attrs.get('content'):
            raise serializers.ValidationError("Quiz content must include questions and answers")

        if content_type == 'video' and not attrs.get('video_url'):
            raise serializers.ValidationError("Video lessons must include a video URL")

        return attrs


class ModuleSerializer(serializers.ModelSerializer):
    """Serializer for course modules with nested lessons"""
    lessons = LessonSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order', 'duration_hours',
            'total_lessons', 'is_locked', 'unlock_criteria',
            'course_title', 'lessons_count', 'lessons',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_lessons']

    def get_lessons_count(self, obj):
        return obj.lessons.count()


class CourseReviewSerializer(serializers.ModelSerializer):
    """Serializer for course reviews and ratings"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = CourseReview
        fields = [
            'id', 'student_name', 'student_username', 'rating', 'review_text',
            'is_anonymous', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for course enrollments with progress"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    course = serializers.IntegerField(source='course.id', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student_name', 'student_username', 'course', 'course_title', 'course_slug',
            'status', 'enrolled_at', 'completed_at', 'last_accessed',
            'progress_percentage', 'current_module', 'current_lesson',
            'amount_paid'
        ]
        read_only_fields = ['id']


class CourseSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for courses with nested data"""
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)
    units = UnitSerializer(many=True, read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)  # Keep for backward compatibility
    reviews = CourseReviewSerializer(many=True, read_only=True)
    enrollment_count = serializers.ReadOnlyField()
    completion_rate = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'short_description',
            'instructor', 'instructor_name', 'instructor_username',
            'thumbnail', 'status', 'level', 'is_free', 'price',
            'max_students', 'duration_weeks', 'total_lessons',
            'enrollment_count', 'completion_rate', 'average_rating',
            'published_at', 'units', 'modules', 'reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'instructor', 'enrollment_count', 'completion_rate',
            'published_at', 'created_at', 'updated_at'
        ]

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 0
        return round(sum(review.rating for review in reviews) / len(reviews), 1)

    def validate(self, attrs):
        """Validate course data - skip validation for updates"""
        # Skip all validation for updates (PATCH requests)
        if self.instance is not None:
            return attrs
        
        # Only validate for create operations
        if attrs.get('status') == 'published' and not attrs.get('description'):
            raise serializers.ValidationError("Published courses must have a description")

        if not attrs.get('is_free') and not attrs.get('price'):
            raise serializers.ValidationError("Paid courses must have a price")

        return attrs

    def create(self, validated_data):
        """Create course with instructor assignment"""
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data)


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for course listings"""
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    enrollment_count = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'short_description', 'thumbnail',
            'instructor_name', 'level', 'is_free', 'price',
            'duration_weeks', 'enrollment_count', 'average_rating',
            'status', 'published_at', 'created_at'
        ]

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 0
        return round(sum(review.rating for review in reviews) / len(reviews), 1)


class CourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for course creation with minimal required fields"""

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'level', 'is_free', 'price',
            'duration_weeks', 'thumbnail'
        ]
        read_only_fields = ['id', 'slug']

    def create(self, validated_data):
        """Create course with instructor assignment"""
        validated_data['instructor'] = self.context['request'].user
        return super().create(validated_data)
