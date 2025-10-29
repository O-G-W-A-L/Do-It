#!/usr/bin/env python
import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from notifications.models import NotificationTemplate

def create_notification_templates():
    """Create default notification templates"""

    templates = [
        {
            'name': 'course_update_email',
            'template_type': 'email',
            'subject': 'Course Update: {{course_title}}',
            'body_template': 'Dear {{user_name}},\n\n{{course_title}} has been updated: {{update_message}}\n\nBest regards,\nDo-It Team',
            'description': 'Email template for course updates',
            'variables': {'course_title': 'Course Title', 'user_name': 'User Name', 'update_message': 'Update Message'}
        },
        {
            'name': 'progress_milestone_email',
            'template_type': 'email',
            'subject': 'Congratulations! Progress Milestone Achieved',
            'body_template': 'Dear {{user_name}},\n\nCongratulations! You have reached {{progress_percentage}}% completion in {{course_title}}.\n\nKeep up the great work!\n\nBest regards,\nDo-It Team',
            'description': 'Email template for progress milestones',
            'variables': {'user_name': 'User Name', 'progress_percentage': 'Progress Percentage', 'course_title': 'Course Title'}
        },
        {
            'name': 'payment_confirmation_email',
            'template_type': 'email',
            'subject': 'Payment Confirmation - Do-It',
            'body_template': 'Dear {{user_name}},\n\nYour payment of {{amount}} {{currency}} has been processed successfully.\n\nTransaction ID: {{transaction_id}}\n\nThank you for your purchase!\n\nBest regards,\nDo-It Team',
            'description': 'Email template for payment confirmations',
            'variables': {'user_name': 'User Name', 'amount': 'Amount', 'currency': 'Currency', 'transaction_id': 'Transaction ID'}
        },
        {
            'name': 'course_update_in_app',
            'template_type': 'in_app',
            'body_template': '{{course_title}} has been updated: {{update_message}}',
            'description': 'In-app template for course updates',
            'variables': {'course_title': 'Course Title', 'update_message': 'Update Message'}
        },
        {
            'name': 'progress_milestone_in_app',
            'template_type': 'in_app',
            'body_template': '🎉 Congratulations! You reached {{progress_percentage}}% in {{course_title}}',
            'description': 'In-app template for progress milestones',
            'variables': {'progress_percentage': 'Progress Percentage', 'course_title': 'Course Title'}
        },
        {
            'name': 'payment_confirmation_in_app',
            'template_type': 'in_app',
            'body_template': '✅ Payment of {{amount}} {{currency}} confirmed',
            'description': 'In-app template for payment confirmations',
            'variables': {'amount': 'Amount', 'currency': 'Currency'}
        }
    ]

    created_count = 0
    for template_data in templates:
        template, created = NotificationTemplate.objects.get_or_create(
            name=template_data['name'],
            defaults=template_data
        )
        if created:
            print(f'Created template: {template.name}')
            created_count += 1
        else:
            print(f'Template already exists: {template.name}')

    print(f'\nSuccessfully created {created_count} notification templates!')
    print(f'Total templates in database: {NotificationTemplate.objects.count()}')

if __name__ == '__main__':
    create_notification_templates()
