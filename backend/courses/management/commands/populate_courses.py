from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from courses.models import Course
from django.utils import timezone


class Command(BaseCommand):
    help = 'Populate database with sample professional development courses'

    def handle(self, *args, **options):
        # Get or create an instructor
        instructor, created = User.objects.get_or_create(
            username='instructor',
            defaults={
                'email': 'abigail@doit.com',
                'first_name': 'Professional',
                'last_name': 'Instructor'
            }
        )
        if created:
            instructor.set_password('abigail')
            instructor.save()
            self.stdout.write(self.style.SUCCESS(f'Created instructor user: {instructor.username}'))

        # Professional development courses data
        courses_data = [
            {
                'title': 'Frontend Development',
                'description': 'Master the art of creating stunning, responsive, and interactive user interfaces. Learn modern frontend development practices, component architecture, state management, and performance optimization techniques that professional developers use in production environments.',
                'short_description': 'Complete frontend development and UI/UX engineering skills',
                'level': 'intermediate',
                'duration_weeks': 12,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'Backend Development & Architecture',
                'description': 'Build robust, scalable server-side applications and APIs. Learn database design, server architecture, security best practices, and performance optimization. Master the fundamentals that power modern web applications and enterprise systems.',
                'short_description': 'Server-side development, APIs, and system architecture',
                'level': 'intermediate',
                'duration_weeks': 14,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'Mobile App Development',
                'description': 'Create professional mobile applications for iOS and Android platforms. Learn cross-platform development strategies, mobile UI/UX principles, app store deployment, and performance optimization for mobile devices.',
                'short_description': 'Cross-platform mobile application development',
                'level': 'intermediate',
                'duration_weeks': 10,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'Professional Skills & Career Development',
                'description': 'Develop essential professional skills for career success. Learn effective communication, leadership techniques, project management methodologies, time management, and workplace ethics. Build the soft skills that complement technical expertise.',
                'short_description': 'Communication, leadership, and career advancement skills',
                'level': 'beginner',
                'duration_weeks': 8,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'Data Science & Analytics',
                'description': 'Transform raw data into actionable insights. Learn statistical analysis, data visualization, predictive modeling, and business intelligence. Master the tools and techniques used by data scientists to drive data-driven decision making.',
                'short_description': 'Data analysis, visualization, and business intelligence',
                'level': 'intermediate',
                'duration_weeks': 16,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'Cloud Computing & Infrastructure',
                'description': 'Master cloud platforms and scalable infrastructure. Learn cloud architecture, deployment strategies, containerization, and infrastructure as code. Understand how to build and manage cloud-native applications at enterprise scale.',
                'short_description': 'Cloud platforms, scalability, and infrastructure management',
                'level': 'advanced',
                'duration_weeks': 12,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'DevOps & Automation',
                'description': 'Streamline development and operations workflows. Learn continuous integration/delivery, infrastructure automation, monitoring, and deployment strategies. Master the tools and practices that enable fast, reliable software delivery.',
                'short_description': 'CI/CD, automation, and deployment pipelines',
                'level': 'intermediate',
                'duration_weeks': 10,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'Cybersecurity Essentials',
                'description': 'Protect digital assets and systems from cyber threats. Learn security principles, encryption, authentication, vulnerability assessment, and incident response. Understand how to build secure applications and protect against common attack vectors.',
                'short_description': 'Digital security, encryption, and threat protection',
                'level': 'beginner',
                'duration_weeks': 8,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'AI & Machine Learning Fundamentals',
                'description': 'Explore artificial intelligence and machine learning concepts. Learn about neural networks, natural language processing, computer vision, and ethical AI development. Understand how to apply AI techniques to solve real-world problems.',
                'short_description': 'Artificial intelligence, ML algorithms, and AI ethics',
                'level': 'advanced',
                'duration_weeks': 15,
                'is_free': True,
                'status': 'published'
            },
            {
                'title': 'AWS professional course',
                'description': 'Master AWS cloud services and architecture. Learn about EC2, S3, RDS, Lambda, and more. Understand how to design and deploy scalable applications on AWS.',
                'short_description': 'AWS services, cloud architecture, and deployment',
                'level': 'advanced',
                'duration_weeks': 15,
                'is_free': True,
                'status': 'published'
            }
        ]

        # Create courses
        created_count = 0
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                title=course_data['title'],
                defaults={
                    'description': course_data['description'],
                    'short_description': course_data['short_description'],
                    'instructor': instructor,
                    'level': course_data['level'],
                    'duration_weeks': course_data['duration_weeks'],
                    'is_free': course_data['is_free'],
                    'status': course_data['status'],
                    'published_at': timezone.now() if course_data['status'] == 'published' else None
                }
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created course: {course.title}'))
            else:
                self.stdout.write(f'Course already exists: {course.title}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(courses_data)} courses. Created {created_count} new courses.'
            )
        )
