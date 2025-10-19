from django.contrib import admin
from .models import (
    Task,
    Project,
    Routine,
    Goal,
    FileAttachment,
    Notification,
)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    list_filter = ('created_at',)
    ordering = ('-created_at',)

@admin.register(Routine)
class RoutineAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'frequency', 'created_at')
    search_fields = ('title', 'frequency', 'user__username')
    list_filter = ('frequency',)
    ordering = ('user',)

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'is_monthly', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    list_filter = ('is_monthly',)
    date_hierarchy = 'created_at'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'user',
        'priority',
        'due_date',
        'is_done',
        'project',
        'routine',
        'goal',
    )
    search_fields = ('title', 'description', 'user__username')
    list_filter = ('priority', 'is_done', 'due_date')
    date_hierarchy = 'due_date'
    raw_id_fields = ('project', 'routine', 'goal')

@admin.register(FileAttachment)
class FileAttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'file', 'uploaded_at')
    search_fields = ('task__title',)
    list_filter = ('uploaded_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'message', 'is_read', 'created_at')
    search_fields = ('message', 'user__username')
    list_filter = ('is_read', 'created_at')

