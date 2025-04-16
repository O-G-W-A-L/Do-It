from django.db import models

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    dueDate     = models.DateTimeField()
    priority    = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='Medium')
    focusBlock  = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
