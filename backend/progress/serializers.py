from rest_framework import serializers
from django.utils import timezone
from .models import (
    LessonProgress, QuizSubmission, AssignmentSubmission,
    StudentAnalytics, QuizQuestion, QuizAnswer, AssignmentRequirement
)


class QuizAnswerSerializer(serializers.ModelSerializer):
    """Serializer for quiz answers"""
    class Meta:
        model = QuizAnswer
        fields = ['id', 'answer_text', 'is_correct', 'order']
        read_only_fields = ['id']


class QuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for quiz questions with answers"""
    answers = QuizAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizQuestion
        fields = [
            'id', 'lesson', 'question_text', 'question_type',
            'points', 'order', 'time_limit', 'answers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentRequirementSerializer(serializers.ModelSerializer):
    """Serializer for assignment requirements"""
    class Meta:
        model = AssignmentRequirement
        fields = [
            'id', 'assignment', 'requirement_text', 'points',
            'is_required', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonProgressSerializer(serializers.ModelSerializer):
    """Serializer for lesson progress tracking"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    module_title = serializers.CharField(source='lesson.module.title', read_only=True)
    course_title = serializers.CharField(source='lesson.module.course.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'student', 'student_name', 'lesson', 'lesson_title',
            'module_title', 'course_title', 'status', 'progress_percentage',
            'time_spent_seconds', 'first_accessed', 'last_accessed',
            'completed_at', 'score', 'max_score', 'attempts_count'
        ]
        read_only_fields = [
            'id', 'student', 'first_accessed', 'updated_at'
        ]

    def update(self, instance, validated_data):
        """Handle progress updates with business logic"""
        if 'status' in validated_data and validated_data['status'] == 'completed':
            if not instance.completed_at:
                validated_data['completed_at'] = timezone.now()

        return super().update(instance, validated_data)


class QuizSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for quiz submissions"""
    quiz_title = serializers.CharField(source='lesson.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    answers = serializers.JSONField()  # Store submitted answers

    class Meta:
        model = QuizSubmission
        fields = [
            'id', 'student', 'student_name', 'lesson', 'quiz_title',
            'answers', 'score', 'max_score', 'percentage', 'passed',
            'submitted_at', 'graded_at', 'time_taken_seconds',
            'attempt_number'
        ]
        read_only_fields = [
            'id', 'student', 'lesson', 'score', 'max_score', 'percentage',
            'passed', 'graded_at', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create quiz submission with auto-grading for objective questions"""
        submission = super().create(validated_data)

        # Auto-grade objective questions
        self._auto_grade_submission(submission)

        return submission

    def _auto_grade_submission(self, submission):
        """Auto-grade objective quiz questions"""
        lesson = submission.lesson
        answers = submission.answers or {}
        total_score = 0
        max_score = 0

        # Get all questions for this lesson
        questions = lesson.quiz_questions.all()

        for question in questions:
            max_score += question.points
            submitted_answer = answers.get(str(question.id))

            if submitted_answer and question.question_type in ['multiple_choice', 'true_false']:
                # Check if answer is correct
                correct_answers = question.answers.filter(is_correct=True)
                if correct_answers.filter(id=submitted_answer).exists():
                    total_score += question.points

        # Update submission with calculated score
        submission.score = total_score
        submission.max_score = max_score
        submission.percentage = (total_score / max_score * 100) if max_score > 0 else 0
        submission.passed = submission.percentage >= 70  # 70% passing threshold
        submission.graded_at = timezone.now()
        submission.save()


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for assignment submissions"""
    assignment_title = serializers.CharField(source='lesson.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    attachments = serializers.JSONField(required=False)

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'student', 'student_name', 'lesson', 'assignment_title',
            'submission_text', 'attachments', 'submitted_at',
            'graded_at', 'score', 'max_score', 'percentage', 'passed',
            'instructor_feedback', 'grade', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'student', 'lesson', 'submitted_at', 'graded_at',
            'score', 'max_score', 'percentage', 'passed', 'grade',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        """Create assignment submission"""
        validated_data['submitted_at'] = timezone.now()
        return super().create(validated_data)


class StudentAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for student analytics"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = StudentAnalytics
        fields = [
            'id', 'student', 'student_name', 'course', 'course_title',
            'total_time_spent', 'lessons_completed', 'quizzes_passed',
            'assignments_submitted', 'current_streak', 'longest_streak',
            'average_score', 'completion_percentage', 'last_activity',
            'engagement_score', 'risk_level', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgressSummarySerializer(serializers.Serializer):
    """Serializer for progress summary data"""
    course_id = serializers.IntegerField()
    course_title = serializers.CharField()
    enrollment_date = serializers.DateTimeField()
    completion_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    lessons_completed = serializers.IntegerField()
    total_lessons = serializers.IntegerField()
    current_module = serializers.CharField(allow_null=True)
    current_lesson = serializers.CharField(allow_null=True)
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    time_spent_hours = serializers.DecimalField(max_digits=6, decimal_places=1)
    next_milestone = serializers.CharField(allow_null=True)


class InstructorAnalyticsSerializer(serializers.Serializer):
    """Serializer for instructor course analytics"""
    course_id = serializers.IntegerField()
    course_title = serializers.CharField()
    total_enrollments = serializers.IntegerField()
    active_students = serializers.IntegerField()
    completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    quiz_completion_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    assignment_submission_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    drop_off_points = serializers.JSONField()
    top_performing_lessons = serializers.JSONField()
    struggling_students_count = serializers.IntegerField()


class GradingSerializer(serializers.Serializer):
    """Serializer for grading submissions"""
    submission_id = serializers.IntegerField()
    score = serializers.DecimalField(max_digits=5, decimal_places=2)
    max_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    feedback = serializers.CharField(required=False, allow_blank=True)
    grade = serializers.ChoiceField(choices=[
        ('A', 'Excellent'), ('B', 'Good'), ('C', 'Satisfactory'),
        ('D', 'Needs Improvement'), ('F', 'Fail')
    ], required=False)
