from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from courses.models import Course, Module, Lesson


class LessonProgress(models.Model):
    """
    Tracks individual student progress through lessons
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress_records')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Scoring
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    attempts_count = models.PositiveIntegerField(default=0)

    # Timing
    time_spent_seconds = models.PositiveIntegerField(default=0)
    first_accessed = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'lesson']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['lesson', 'status']),
            models.Index(fields=['status', 'last_accessed']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title} ({self.status})"

    @property
    def is_completed(self):
        return self.status == 'completed' and self.completed_at is not None


class QuizQuestion(models.Model):
    """
    Quiz questions for lessons
    """
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
        ('essay', 'Essay'),
    ]

    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quiz_questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='multiple_choice')

    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=1)
    time_limit = models.DurationField(null=True, blank=True)  # Time limit for question

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = ['lesson', 'order']
        indexes = [
            models.Index(fields=['lesson', 'order']),
            models.Index(fields=['question_type']),
        ]

    def __str__(self):
        return f"{self.lesson.title} - Q{self.order}: {self.question_text[:50]}"


class QuizAnswer(models.Model):
    """
    Answers for quiz questions
    """
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']
        unique_together = ['question', 'order']

    def __str__(self):
        return f"Answer {self.order} for {self.question}"


class QuizSubmission(models.Model):
    """
    Student quiz submissions
    """
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_submissions')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='quiz_submissions')

    answers = models.JSONField()  # Store submitted answers as JSON
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(null=True, blank=True)
    attempt_number = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ['student', 'lesson', 'attempt_number']
        indexes = [
            models.Index(fields=['student', 'lesson']),
            models.Index(fields=['passed', 'submitted_at']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title} (Attempt {self.attempt_number})"


class AssignmentRequirement(models.Model):
    """
    Requirements for assignments
    """
    assignment = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='assignment_requirements')
    requirement_text = models.TextField()
    points = models.PositiveIntegerField(default=0)
    is_required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        unique_together = ['assignment', 'order']

    def __str__(self):
        return f"Requirement {self.order} for {self.assignment.title}"


class AssignmentSubmission(models.Model):
    """
    Student assignment submissions
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('returned', 'Returned'),
    ]

    GRADE_CHOICES = [
        ('A', 'Excellent'),
        ('B', 'Good'),
        ('C', 'Satisfactory'),
        ('D', 'Needs Improvement'),
        ('F', 'Fail'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='assignment_submissions')

    submission_text = models.TextField(blank=True)
    attachments = models.JSONField(null=True, blank=True)  # File URLs/paths

    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    # Grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    passed = models.BooleanField(null=True, blank=True)
    grade = models.CharField(max_length=1, choices=GRADE_CHOICES, null=True, blank=True)
    instructor_feedback = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    class Meta:
        unique_together = ['student', 'lesson']
        indexes = [
            models.Index(fields=['student', 'lesson']),
            models.Index(fields=['status', 'submitted_at']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title} ({self.status})"

    def submit(self):
        """Mark assignment as submitted"""
        if self.status == 'draft':
            self.status = 'submitted'
            self.submitted_at = timezone.now()
            self.save()

    def grade_assignment(self, score, max_score, feedback='', grade=None):
        """Grade the assignment"""
        self.score = score
        self.max_score = max_score
        self.percentage = (score / max_score * 100) if max_score > 0 else 0
        self.passed = self.percentage >= 70
        self.grade = grade
        self.instructor_feedback = feedback
        self.graded_at = timezone.now()
        self.status = 'graded'
        self.save()


class StudentAnalytics(models.Model):
    """
    Analytics and insights for individual students in courses
    """
    RISK_LEVELS = [
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical Risk'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='student_analytics')

    # Progress metrics
    total_time_spent = models.PositiveIntegerField(default=0)  # in seconds
    lessons_completed = models.PositiveIntegerField(default=0)
    completion_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Engagement metrics
    current_streak = models.PositiveIntegerField(default=0)  # consecutive days active
    longest_streak = models.PositiveIntegerField(default=0)
    engagement_score = models.PositiveIntegerField(default=0)  # 0-100 scale

    # Assessment metrics
    quizzes_passed = models.PositiveIntegerField(default=0)
    assignments_submitted = models.PositiveIntegerField(default=0)

    # Risk assessment
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS, default='low')
    last_activity = models.DateTimeField(auto_now=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'course']
        indexes = [
            models.Index(fields=['student', 'course']),
            models.Index(fields=['risk_level', 'last_activity']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.course.title} Analytics"

    def calculate_engagement_score(self):
        """Calculate engagement score based on various metrics"""
        score = 0

        # Completion percentage (40% weight)
        score += self.completion_percentage * 0.4

        # Average score (30% weight)
        if self.average_score:
            score += self.average_score * 0.3

        # Activity streak (20% weight)
        streak_score = min(self.current_streak * 5, 20)  # Max 20 points for streak
        score += streak_score

        # Time spent (10% weight) - normalize to reasonable range
        time_hours = self.total_time_spent / 3600
        time_score = min(time_hours * 2, 10)  # Max 10 points for time
        score += time_score

        self.engagement_score = min(int(score), 100)
        return self.engagement_score

    def assess_risk_level(self):
        """Assess student risk level based on engagement and progress"""
        if self.completion_percentage < 25 or self.engagement_score < 30:
            self.risk_level = 'critical'
        elif self.completion_percentage < 50 or self.engagement_score < 50:
            self.risk_level = 'high'
        elif self.completion_percentage < 75 or self.engagement_score < 70:
            self.risk_level = 'medium'
        else:
            self.risk_level = 'low'

        return self.risk_level
