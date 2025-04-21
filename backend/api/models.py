# api/models.py

import uuid
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

def default_expiry():
    """
    Return a timezone‑aware datetime 24 hours from now.
    Named function so Django migrations can serialize it.
    """
    return timezone.now() + timedelta(hours=24)


class EmailVerification(models.Model):
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    token    = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created  = models.DateTimeField(auto_now_add=True)
    expires  = models.DateTimeField(default=default_expiry)
    used     = models.BooleanField(default=False)

    def is_valid(self):
        return (not self.used) and (timezone.now() < self.expires)

    def __str__(self):
        return f"EmailVerification(token={self.token}, user={self.user.username})"


class Project(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Routine(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routines')
    title       = models.CharField(max_length=255)
    frequency   = models.CharField(max_length=50)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Goal(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_monthly  = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('Must Do',   'Must Do'),
        ('Should Do', 'Should Do'),
        ('Could Do',  'Could Do'),
        ('Might Do',  'Might Do'),
    ]

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date    = models.DateTimeField()
    project     = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True)
    routine     = models.ForeignKey(Routine, on_delete=models.SET_NULL, null=True, blank=True)
    goal        = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True)
    priority    = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Should Do')
    focus_block = models.BooleanField(default=False)
    is_done     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class FileAttachment(models.Model):
    task        = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='files')
    file        = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
