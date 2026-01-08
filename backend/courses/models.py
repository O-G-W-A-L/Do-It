from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.text import slugify

class Course(models.Model):
    """
    Top-level course container with metadata and enrollment rules.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200, blank=True, null=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')

    # Metadata
    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')

    # Enrollment settings
    is_free = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_students = models.PositiveIntegerField(blank=True, null=True)

    # Content organization
    duration_weeks = models.PositiveIntegerField(default=4)
    total_lessons = models.PositiveIntegerField(default=0)  # Auto-calculated

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['instructor', 'status']),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        elif self.status != 'published':
            self.published_at = None

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def enrollment_count(self):
        return self.enrollments.filter(status__in=['active', 'completed']).count()

    @property
    def completion_rate(self):
        total_enrollments = self.enrollments.filter(status__in=['active', 'completed']).count()
        if total_enrollments == 0:
            return 0
        completed = self.enrollments.filter(status='completed').count()
        return (completed / total_enrollments) * 100


class Unit(models.Model):
    """
    Course units (sections/topics) containing modules.
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='units')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)

    # Content
    duration_weeks = models.DecimalField(max_digits=4, decimal_places=1, default=1)
    total_modules = models.PositiveIntegerField(default=0)  # Auto-calculated

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = ['course', 'order']
        indexes = [
            models.Index(fields=['course', 'order']),
        ]

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def clean(self):
        if Unit.objects.filter(course=self.course, order=self.order).exclude(pk=self.pk).exists():
            raise ValidationError(f"Order {self.order} already exists for this course.")


class Module(models.Model):
    """
    Course modules (weeks/topics) containing lessons.
    """
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='modules', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)

    # Content
    duration_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    total_lessons = models.PositiveIntegerField(default=0)  # Auto-calculated

    # Access control
    is_locked = models.BooleanField(default=False)
    unlock_criteria = models.JSONField(blank=True, null=True)  # e.g., {"previous_module": true}

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = ['course', 'order']
        indexes = [
            models.Index(fields=['course', 'order']),
            models.Index(fields=['is_locked']),
        ]

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def clean(self):
        if Module.objects.filter(course=self.course, order=self.order).exclude(pk=self.pk).exists():
            raise ValidationError(f"Order {self.order} already exists for this course.")


class Lesson(models.Model):
    """
    Individual lessons containing content.
    """
    CONTENT_TYPES = [
        ('text', 'Text'),
        ('video', 'Video'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('resource', 'Resource'),
    ]

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=1)

    # Content
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES, default='text')
    content = models.JSONField(blank=True, null=True)  # Flexible content storage

    # Media
    video_url = models.URLField(blank=True)
    video_duration = models.DurationField(blank=True, null=True)
    attachments = models.JSONField(blank=True, null=True)  # File URLs

    # Settings
    is_required = models.BooleanField(default=True)
    estimated_duration = models.DurationField(blank=True, null=True)

    # Metadata
    tags = models.JSONField(blank=True, null=True)
    difficulty = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ], default='medium')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = ['module', 'order']
        indexes = [
            models.Index(fields=['module', 'order']),
            models.Index(fields=['content_type']),
        ]

    def __str__(self):
        return f"{self.module.title} - {self.title}"

    def clean(self):
        if Lesson.objects.filter(module=self.module, order=self.order).exclude(pk=self.pk).exists():
            raise ValidationError(f"Order {self.order} already exists for this module.")

    @property
    def course(self):
        return self.module.course


class Enrollment(models.Model):
    """
    Student enrollments in courses.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('expired', 'Expired'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    last_accessed = models.DateTimeField(auto_now=True)

    # Progress tracking
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    current_module = models.ForeignKey(Module, on_delete=models.SET_NULL, blank=True, null=True)
    current_lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, blank=True, null=True)

    # Payment info (if applicable)
    payment_id = models.CharField(max_length=100, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ['student', 'course']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['course', 'status']),
            models.Index(fields=['status', 'enrolled_at']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.course.title}"

    @property
    def is_completed(self):
        return self.status == 'completed' and self.completed_at is not None


class CourseReview(models.Model):
    """
    Student reviews and ratings for courses.
    """
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')

    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    review_text = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course']
        indexes = [
            models.Index(fields=['course', 'rating']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.course.title} ({self.rating}★)"
