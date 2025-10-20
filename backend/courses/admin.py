from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Course, Module, Lesson, Enrollment, CourseReview


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'rating', 'is_anonymous', 'created_at')
    list_filter = ('rating', 'is_anonymous', 'created_at')
    search_fields = ('student__username', 'course__title', 'review_text')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'status', 'progress_percentage', 'enrolled_at')
    list_filter = ('status', 'enrolled_at', 'course__level')
    search_fields = ('student__username', 'course__title')
    readonly_fields = ('enrolled_at', 'last_accessed')

    fieldsets = (
        ('Enrollment Info', {
            'fields': ('student', 'course', 'status', 'enrolled_at')
        }),
        ('Progress', {
            'fields': ('progress_percentage', 'current_module', 'current_lesson')
        }),
        ('Payment', {
            'fields': ('amount_paid',)
        }),
        ('Timestamps', {
            'fields': ('last_accessed', 'completed_at', 'created_at'),
            'classes': ('collapse',)
        }),
    )


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ('title', 'content_type', 'order', 'is_required')
    readonly_fields = ('created_at',)


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_locked', 'lessons_count', 'created_at')
    list_filter = ('is_locked', 'created_at', 'course__level')
    search_fields = ('title', 'course__title', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [LessonInline]

    fieldsets = (
        ('Module Info', {
            'fields': ('course', 'title', 'description', 'order')
        }),
        ('Content', {
            'fields': ('duration_hours', 'is_locked', 'unlock_criteria')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def lessons_count(self, obj):
        return obj.lessons.count()
    lessons_count.short_description = 'Lessons'


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0
    fields = ('title', 'order', 'is_locked', 'lessons_count')
    readonly_fields = ('lessons_count', 'created_at')
    show_change_link = True

    def lessons_count(self, obj):
        return obj.lessons.count()
    lessons_count.short_description = 'Lessons'


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'course', 'content_type', 'order', 'is_required', 'created_at')
    list_filter = ('content_type', 'is_required', 'created_at', 'module__course__level')
    search_fields = ('title', 'module__title', 'module__course__title')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Lesson Info', {
            'fields': ('module', 'title', 'description', 'order')
        }),
        ('Content', {
            'fields': ('content_type', 'content', 'video_url', 'video_duration', 'attachments')
        }),
        ('Settings', {
            'fields': ('is_required', 'estimated_duration', 'tags', 'difficulty')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def course(self, obj):
        return obj.module.course.title
    course.short_description = 'Course'


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'instructor', 'status_badge', 'level', 'enrollment_count',
                   'average_rating', 'is_free', 'published_at')
    list_filter = ('status', 'level', 'is_free', 'created_at', 'published_at')
    search_fields = ('title', 'description', 'instructor__username', 'instructor__email')
    readonly_fields = ('slug', 'enrollment_count', 'completion_rate', 'created_at', 'updated_at')
    inlines = [ModuleInline]

    fieldsets = (
        ('Course Info', {
            'fields': ('title', 'slug', 'description', 'short_description', 'instructor')
        }),
        ('Media', {
            'fields': ('thumbnail',)
        }),
        ('Settings', {
            'fields': ('status', 'level', 'is_free', 'price', 'max_students', 'duration_weeks')
        }),
        ('Statistics', {
            'fields': ('enrollment_count', 'completion_rate', 'total_lessons'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('published_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['publish_courses', 'unpublish_courses']

    def status_badge(self, obj):
        colors = {
            'draft': '#6B7280',
            'published': '#059669',
            'archived': '#DC2626'
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return 'No reviews'
        avg = sum(review.rating for review in reviews) / len(reviews)
        return f"{avg:.1f}★ ({len(reviews)})"
    average_rating.short_description = 'Rating'

    def publish_courses(self, request, queryset):
        updated = queryset.filter(status='draft').update(
            status='published',
            published_at=timezone.now()
        )
        self.message_user(request, f'Published {updated} courses.')
    publish_courses.short_description = 'Publish selected courses'

    def unpublish_courses(self, request, queryset):
        updated = queryset.filter(status='published').update(status='draft')
        self.message_user(request, f'Unpublished {updated} courses.')
    unpublish_courses.short_description = 'Unpublish selected courses'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # For non-admin instructors, only show their courses
        if request.user.profile.is_instructor and not request.user.profile.is_admin:
            return qs.filter(instructor=request.user)
        return qs
