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

    # Tiered deadlines 
    tier_1_deadline = models.DateTimeField(null=True, blank=True, help_text="First deadline - 100% max score")
    tier_2_deadline = models.DateTimeField(null=True, blank=True, help_text="Second deadline - 65% max score")
    tier_3_deadline = models.DateTimeField(null=True, blank=True, help_text="Third/late deadline - 50% max score")
    
    # Tier cap applied (which tier was used)
    applied_tier = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Which tier was applied: 1, 2, or 3")
    tier_cap_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="The capped percentage based on tier")

    class Meta:
        unique_together = ['student', 'lesson']
        indexes = [
            models.Index(fields=['student', 'lesson']),
            models.Index(fields=['status', 'submitted_at']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title} ({self.status})"

    def calculate_tier(self):
        """Calculate which tier deadline applies and apply cap"""
        now = timezone.now()
        
        if self.tier_1_deadline and now <= self.tier_1_deadline:
            self.applied_tier = 1
            self.tier_cap_percentage = 100
            return 1
        elif self.tier_2_deadline and now <= self.tier_2_deadline:
            self.applied_tier = 2
            self.tier_cap_percentage = 65
            return 2
        elif self.tier_3_deadline and now <= self.tier_3_deadline:
            self.applied_tier = 3
            self.tier_cap_percentage = 50
            return 3
        else:
            # Past all deadlines - still allow submission but with lowest tier
            self.applied_tier = 3
            self.tier_cap_percentage = 50
            return 3

    def apply_tier_cap(self, raw_percentage):
        """Apply tier cap to the raw percentage score"""
        tier = self.calculate_tier()
        
        if self.tier_cap_percentage:
            return min(raw_percentage, float(self.tier_cap_percentage))
        return raw_percentage

    def submit(self):
        """Mark assignment as submitted"""
        if self.status == 'draft':
            self.status = 'submitted'
            self.submitted_at = timezone.now()
            self.calculate_tier()  # Calculate which tier applies
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


class Cohort(models.Model):
    """
    Student cohorts for peer review assignments - ALX style
    """
    name = models.CharField(max_length=100)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='cohorts')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Peer review settings
    reviewers_per_submission = models.PositiveIntegerField(default=3, help_text="Number of peers to assign per submission")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ['name', 'course']

    def __str__(self):
        return f"{self.name} - {self.course.title}"

    @property
    def student_count(self):
        return self.members.count()


class CohortMember(models.Model):
    """
    Membership in a cohort
    """
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='members')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cohort_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['cohort', 'student']

    def __str__(self):
        return f"{self.student.username} in {self.cohort.name}"


class PeerReviewRubric(models.Model):
    """
    Rubric criteria for peer reviews - ALX style
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='peer_review_rubrics')
    name = models.CharField(max_length=200, help_text="e.g., Project Code Quality Rubric")
    description = models.TextField(blank=True)
    
    # Rubric criteria stored as JSON
    # [{"name": "Code Quality", "max_points": 10, "description": "Code is clean and well-organized"}]
    criteria = models.JSONField(default=list)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.course.title}"

    @property
    def max_score(self):
        return sum(c.get('max_points', 0) for c in self.criteria)


class PeerReviewAssignment(models.Model):
    """
    Assignment of submissions to peers for review - ALX style
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name='peer_reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='peer_review_tasks')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Rubric scores stored as JSON
    rubric_scores = models.JSONField(default=dict, blank=True)
    total_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Feedback
    feedback = models.TextField(blank=True)
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['submission', 'reviewer']
        indexes = [
            models.Index(fields=['reviewer', 'status']),
            models.Index(fields=['submission', 'status']),
        ]

    def __str__(self):
        return f"Peer Review: {self.submission.student.username}'s {self.submission.lesson.title} by {self.reviewer.username}"
