from django.contrib import admin
from django.utils.html import format_html
from .models import (
    LessonProgress, QuizSubmission, AssignmentSubmission,
    StudentAnalytics, QuizQuestion, QuizAnswer, AssignmentRequirement
)


class QuizAnswerInline(admin.TabularInline):
    model = QuizAnswer
    extra = 1
    fields = ('answer_text', 'is_correct', 'order')


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ('question', 'answer_text', 'is_correct', 'order')
    list_filter = ('is_correct',)
    search_fields = ('question__question_text', 'answer_text')


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('lesson', 'question_text', 'question_type', 'points', 'order')
    list_filter = ('question_type', 'lesson__module__course__level')
    search_fields = ('question_text', 'lesson__title')
    inlines = [QuizAnswerInline]


@admin.register(AssignmentRequirement)
class AssignmentRequirementAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'requirement_text', 'points', 'is_required', 'order')
    list_filter = ('is_required',)
    search_fields = ('requirement_text', 'assignment__title')


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'status', 'progress_percentage',
                   'score', 'completed_at', 'last_accessed')
    list_filter = ('status', 'completed_at', 'lesson__module__course__level')
    search_fields = ('student__username', 'lesson__title')
    readonly_fields = ('first_accessed', 'last_accessed', 'completed_at')

    fieldsets = (
        ('Progress Info', {
            'fields': ('student', 'lesson', 'status', 'progress_percentage')
        }),
        ('Scoring', {
            'fields': ('score', 'max_score', 'attempts_count')
        }),
        ('Timing', {
            'fields': ('time_spent_seconds', 'first_accessed', 'last_accessed', 'completed_at')
        }),
    )


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'score', 'percentage', 'passed',
                   'submitted_at', 'attempt_number')
    list_filter = ('passed', 'submitted_at', 'lesson__module__course__level')
    search_fields = ('student__username', 'lesson__title')
    readonly_fields = ('score', 'max_score', 'percentage', 'passed', 'graded_at')

    fieldsets = (
        ('Submission Info', {
            'fields': ('student', 'lesson', 'submitted_at', 'attempt_number')
        }),
        ('Answers', {
            'fields': ('answers',)
        }),
        ('Grading', {
            'fields': ('score', 'max_score', 'percentage', 'passed', 'graded_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'status', 'score', 'percentage',
                   'passed', 'submitted_at', 'graded_at')
    list_filter = ('status', 'passed', 'submitted_at', 'lesson__module__course__level')
    search_fields = ('student__username', 'lesson__title')
    readonly_fields = ('submitted_at', 'graded_at', 'score', 'max_score', 'percentage', 'passed')

    fieldsets = (
        ('Submission Info', {
            'fields': ('student', 'lesson', 'submitted_at')
        }),
        ('Content', {
            'fields': ('submission_text', 'attachments')
        }),
        ('Grading', {
            'fields': ('score', 'max_score', 'percentage', 'passed', 'grade', 'instructor_feedback', 'graded_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_as_graded', 'mark_as_passed']

    def mark_as_graded(self, request, queryset):
        updated = queryset.filter(status='submitted').update(status='graded')
        self.message_user(request, f'Marked {updated} submissions as graded.')
    mark_as_graded.short_description = 'Mark selected submissions as graded'

    def mark_as_passed(self, request, queryset):
        updated = queryset.filter(passed=False).update(passed=True)
        self.message_user(request, f'Marked {updated} submissions as passed.')
    mark_as_passed.short_description = 'Mark selected submissions as passed'


@admin.register(StudentAnalytics)
class StudentAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'completion_percentage', 'average_score',
                   'lessons_completed', 'engagement_score', 'last_activity')
    list_filter = ('last_activity', 'course__level', 'engagement_score')
    search_fields = ('student__username', 'course__title')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Student & Course', {
            'fields': ('student', 'course')
        }),
        ('Progress Metrics', {
            'fields': ('lessons_completed', 'completion_percentage', 'average_score')
        }),
        ('Engagement', {
            'fields': ('total_time_spent', 'current_streak', 'longest_streak', 'engagement_score')
        }),
        ('Assessment Stats', {
            'fields': ('quizzes_passed', 'assignments_submitted')
        }),
        ('Risk Assessment', {
            'fields': ('risk_level', 'last_activity')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def engagement_score_display(self, obj):
        if obj.engagement_score >= 80:
            color = 'green'
        elif obj.engagement_score >= 60:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{}</span>',
            color, obj.engagement_score
        )
    engagement_score_display.short_description = 'Engagement Score'
