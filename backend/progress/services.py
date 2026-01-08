from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from courses.models import Course, Enrollment
from .models import LessonProgress, QuizSubmission, AssignmentSubmission


class ProgressAnalyticsService:
    """
    Service layer for progress analytics calculations.
    Extracted business logic from view functions to improve maintainability and testability.
    """

    @staticmethod
    def get_student_progress_data(user):
        """
        Calculate progress data for student's enrolled courses.
        Optimized to use batch queries instead of N+1 queries.
        """
        # Get all enrollments with course data
        enrollments = Enrollment.objects.filter(
            student=user, status__in=['active', 'completed']
        ).select_related('course')

        if not enrollments:
            return []

        # Get all enrolled course IDs for batch queries
        enrolled_course_ids = [e.course.id for e in enrollments]
        enrollment_by_course = {e.course.id: e for e in enrollments}

        # Batch query: Get all progress records for enrolled courses
        progress_records = LessonProgress.objects.filter(
            student=user,
            lesson__module__course_id__in=enrolled_course_ids
        ).select_related('lesson__module__course', 'lesson__module')

        # Organize progress data by course for efficient lookup
        progress_by_course = {}
        for progress in progress_records:
            course_id = progress.lesson.module.course.id
            if course_id not in progress_by_course:
                progress_by_course[course_id] = {
                    'all_progress': [],
                    'completed_count': 0,
                    'total_time': 0,
                    'scores': [],
                    'latest_accessed': None
                }

            course_data = progress_by_course[course_id]
            course_data['all_progress'].append(progress)

            if progress.status == 'completed':
                course_data['completed_count'] += 1

            course_data['total_time'] += (progress.time_spent_seconds or 0)

            if progress.score is not None:
                course_data['scores'].append(progress.score)

            # Track latest accessed
            if course_data['latest_accessed'] is None or progress.last_accessed > course_data['latest_accessed']:
                course_data['latest_accessed'] = progress.last_accessed

        progress_data = []

        for course_id, course_progress in progress_by_course.items():
            course = enrollment_by_course[course_id].course
            enrollment = enrollment_by_course[course_id]

            # Calculate metrics
            total_lessons = course.total_lessons
            completed_lessons = course_progress['completed_count']
            total_time_seconds = course_progress['total_time']
            scores = course_progress['scores']

            # Get current position from latest accessed progress
            current_module = None
            current_lesson = None
            if course_progress['all_progress']:
                latest_progress = max(course_progress['all_progress'],
                                    key=lambda p: p.last_accessed or timezone.now().replace(year=1900))
                current_module = latest_progress.lesson.module.title
                current_lesson = latest_progress.lesson.title

            # Calculate averages
            avg_score = sum(scores) / len(scores) if scores else None
            time_spent_hours = total_time_seconds / 3600

            # Next milestone
            completion_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
            if completion_pct < 25:
                next_milestone = "25% Complete"
            elif completion_pct < 50:
                next_milestone = "50% Complete"
            elif completion_pct < 75:
                next_milestone = "75% Complete"
            elif completion_pct < 100:
                next_milestone = "Course Complete"
            else:
                next_milestone = None

            progress_summary = {
                'course_id': course.id,
                'course_title': course.title,
                'enrollment_date': enrollment.enrolled_at,
                'completion_percentage': round(completion_pct, 2),
                'lessons_completed': completed_lessons,
                'total_lessons': total_lessons,
                'current_module': current_module,
                'current_lesson': current_lesson,
                'average_score': round(avg_score, 2) if avg_score else None,
                'time_spent_hours': round(time_spent_hours, 2),
                'next_milestone': next_milestone
            }

            progress_data.append(progress_summary)

        return progress_data

    @staticmethod
    def get_instructor_analytics_data(user):
        """
        Calculate analytics data for instructor's courses.
        Optimized to use batch queries instead of N+1 queries.
        """
        courses = Course.objects.filter(instructor=user) if not user.profile.is_admin else Course.objects.all()

        if not courses:
            return []

        course_ids = [c.id for c in courses]
        courses_by_id = {c.id: c for c in courses}

        # Batch query: Get all enrollments for instructor's courses
        all_enrollments = Enrollment.objects.filter(course_id__in=course_ids)
        enrollments_by_course = {}
        for enrollment in all_enrollments:
            course_id = enrollment.course_id
            if course_id not in enrollments_by_course:
                enrollments_by_course[course_id] = []
            enrollments_by_course[course_id].append(enrollment)

        # Batch query: Get all progress data for analytics
        progress_data = LessonProgress.objects.filter(
            lesson__module__course_id__in=course_ids
        ).select_related('lesson')

        # Organize progress data by course
        progress_by_course = {}
        for progress in progress_data:
            course_id = progress.lesson.module.course_id
            if course_id not in progress_by_course:
                progress_by_course[course_id] = {
                    'scores': [],
                    'completed_count': 0,
                    'quiz_lessons': set(),
                    'assignment_lessons': set()
                }

            course_data = progress_by_course[course_id]

            if progress.score is not None:
                course_data['scores'].append(progress.score)

            if progress.status == 'completed':
                course_data['completed_count'] += 1

            # Track content types
            if progress.lesson.content_type == 'quiz':
                course_data['quiz_lessons'].add(progress.lesson.id)
            elif progress.lesson.content_type == 'assignment':
                course_data['assignment_lessons'].add(progress.lesson.id)

        # Batch query: Get quiz submissions
        quiz_submissions = QuizSubmission.objects.filter(
            lesson__module__course_id__in=course_ids,
            passed=True
        ).values('lesson__module__course_id').annotate(
            student_count=Count('student', distinct=True)
        )

        quiz_completion_by_course = {item['lesson__module__course_id']: item['student_count'] for item in quiz_submissions}

        # Batch query: Get assignment submissions
        assignment_submissions = AssignmentSubmission.objects.filter(
            lesson__module__course_id__in=course_ids
        ).values('lesson__module__course_id').annotate(
            student_count=Count('student', distinct=True)
        )

        assignment_completion_by_course = {item['lesson__module__course_id']: item['student_count'] for item in assignment_submissions}

        analytics_data = []

        for course_id, course in courses_by_id.items():
            enrollments = enrollments_by_course.get(course_id, [])
            total_enrollments = len(enrollments)
            active_students = sum(1 for e in enrollments if e.status == 'active')
            completed_students = sum(1 for e in enrollments if e.status == 'completed')

            completion_rate = (completed_students / total_enrollments * 100) if total_enrollments > 0 else 0

            # Average scores
            course_progress = progress_by_course.get(course_id, {})
            scores = course_progress.get('scores', [])
            avg_score = sum(scores) / len(scores) if scores else 0

            # Quiz completion rate
            total_quizzes = len(course_progress.get('quiz_lessons', set()))
            completed_quizzes = quiz_completion_by_course.get(course_id, 0)
            quiz_completion_rate = (completed_quizzes / total_enrollments * 100) if total_enrollments > 0 else 0

            # Assignment submission rate
            total_assignments = len(course_progress.get('assignment_lessons', set()))
            submitted_assignments = assignment_completion_by_course.get(course_id, 0)
            assignment_submission_rate = (submitted_assignments / total_enrollments * 100) if total_enrollments > 0 else 0

            # Drop-off analysis (simplified)
            drop_off_points = {
                'module_1_completion': 85,  # Mock data
                'module_2_completion': 65,
                'module_3_completion': 45
            }

            # Top performing lessons (simplified - would need more complex batching)
            # For now, keeping the original query since it's already optimized with annotate
            top_lessons = LessonProgress.objects.filter(
                lesson__module__course=course, status='completed'
            ).values('lesson__title').annotate(
                completion_count=Count('id')
            ).order_by('-completion_count')[:5]

            top_performing_lessons = [
                {'lesson': item['lesson__title'], 'completions': item['completion_count']}
                for item in top_lessons
            ]

            # Struggling students (low completion rates)
            struggling_students = sum(1 for e in enrollments if e.progress_percentage < 30)

            analytics_summary = {
                'course_id': course.id,
                'course_title': course.title,
                'total_enrollments': total_enrollments,
                'active_students': active_students,
                'completion_rate': round(completion_rate, 2),
                'average_score': round(avg_score, 2),
                'quiz_completion_rate': round(quiz_completion_rate, 2),
                'assignment_submission_rate': round(assignment_submission_rate, 2),
                'drop_off_points': drop_off_points,
                'top_performing_lessons': top_performing_lessons,
                'struggling_students_count': struggling_students
            }

            analytics_data.append(analytics_summary)

        return analytics_data
