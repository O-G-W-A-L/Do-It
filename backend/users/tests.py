from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core import mail
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from .models import AdminInvitation, Profile

User = get_user_model()


class AdminInvitationModelTest(TestCase):
    """Test AdminInvitation model functionality"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='password123'
        )
        self.admin_user.profile.role = 'admin'
        self.admin_user.profile.save()

    def test_invitation_creation(self):
        """Test invitation is created with correct defaults"""
        invitation = AdminInvitation.objects.create(
            email='test@example.com',
            role='instructor',
            invited_by=self.admin_user
        )

        self.assertEqual(invitation.email, 'test@example.com')
        self.assertEqual(invitation.role, 'instructor')
        self.assertFalse(invitation.used)
        self.assertIsNone(invitation.accepted_at)
        self.assertTrue(invitation.is_valid())

    def test_invitation_expiry(self):
        """Test invitation expires after 24 hours"""
        invitation = AdminInvitation.objects.create(
            email='test@example.com',
            role='instructor',
            invited_by=self.admin_user
        )

        # Should be valid initially
        self.assertTrue(invitation.is_valid())

        # Expire the invitation
        invitation.expires = timezone.now() - timedelta(hours=1)
        invitation.save()

        self.assertFalse(invitation.is_valid())

    def test_invitation_acceptance(self):
        """Test invitation acceptance updates user role"""
        invitation = AdminInvitation.objects.create(
            email='test@example.com',
            role='instructor',
            invited_by=self.admin_user
        )

        # Create user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )

        # Accept invitation
        invitation.accept(user)

        # Refresh from database
        invitation.refresh_from_db()
        user.profile.refresh_from_db()

        self.assertTrue(invitation.used)
        self.assertIsNotNone(invitation.accepted_at)
        self.assertEqual(user.profile.role, 'instructor')


class AdminInvitationAPITest(APITestCase):
    """Test AdminInvitation API endpoints"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='password123'
        )
        self.admin_user.profile.role = 'admin'
        self.admin_user.profile.save()

        self.instructor_user = User.objects.create_user(
            username='instructor',
            email='instructor@test.com',
            password='password123'
        )
        self.instructor_user.profile.role = 'instructor'
        self.instructor_user.profile.save()

        self.student_user = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='password123'
        )
        # student role is default

    def test_send_invitation_admin_only(self):
        """Test only admins can send invitations"""
        self.client.force_authenticate(user=self.student_user)

        response = self.client.post('/api/auth/admin/send-invitation/', {
            'email': 'newuser@test.com',
            'role': 'instructor'
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_send_invitation_success(self):
        """Test successful invitation sending"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post('/api/auth/admin/send-invitation/', {
            'email': 'newuser@test.com',
            'role': 'instructor'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('invitation_id', response.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('newuser@test.com', mail.outbox[0].to)

    def test_send_duplicate_invitation(self):
        """Test sending invitation to already invited email"""
        self.client.force_authenticate(user=self.admin_user)

        # Send first invitation
        self.client.post('/api/auth/admin/send-invitation/', {
            'email': 'newuser@test.com',
            'role': 'instructor'
        })

        # Try to send second invitation
        response = self.client.post('/api/auth/admin/send-invitation/', {
            'email': 'newuser@test.com',
            'role': 'instructor'
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already sent', response.data['detail'])

    def test_accept_invitation_invalid_token(self):
        """Test accepting invitation with invalid token"""
        response = self.client.get('/api/auth/admin/accept-invitation/invalid-token/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid invitation', response.data['detail'])

    def test_accept_invitation_expired(self):
        """Test accepting expired invitation"""
        invitation = AdminInvitation.objects.create(
            email='test@example.com',
            role='instructor',
            invited_by=self.admin_user,
            expires=timezone.now() - timedelta(hours=1)
        )

        response = self.client.get(f'/api/auth/admin/accept-invitation/{invitation.token}/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', response.data['detail'])

    def test_accept_invitation_new_user(self):
        """Test accepting invitation creates new user"""
        invitation = AdminInvitation.objects.create(
            email='newuser@test.com',
            role='instructor',
            invited_by=self.admin_user
        )

        response = self.client.get(f'/api/auth/admin/accept-invitation/{invitation.token}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Account created', response.data['detail'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

        # Check user was created
        user = User.objects.get(email='newuser@test.com')
        self.assertEqual(user.profile.role, 'instructor')

        # Check invitation was marked as used
        invitation.refresh_from_db()
        self.assertTrue(invitation.used)

    def test_accept_invitation_existing_user(self):
        """Test accepting invitation updates existing user role"""
        # Create existing user
        existing_user = User.objects.create_user(
            username='existing',
            email='existing@test.com',
            password='password123'
        )

        invitation = AdminInvitation.objects.create(
            email='existing@test.com',
            role='admin',
            invited_by=self.admin_user
        )

        response = self.client.get(f'/api/auth/admin/accept-invitation/{invitation.token}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('role has been updated', response.data['detail'])

        # Check role was updated
        existing_user.profile.refresh_from_db()
        self.assertEqual(existing_user.profile.role, 'admin')

    def test_accept_invitation_used(self):
        """Test accepting already used invitation"""
        invitation = AdminInvitation.objects.create(
            email='test@example.com',
            role='instructor',
            invited_by=self.admin_user,
            used=True
        )

        response = self.client.get(f'/api/auth/admin/accept-invitation/{invitation.token}/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid invitation', response.data['detail'])


class UserRoleRedirectTest(APITestCase):
    """Test role-based login redirects"""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='password123'
        )
        self.admin_user.profile.role = 'admin'
        self.admin_user.profile.save()

        self.instructor_user = User.objects.create_user(
            username='instructor',
            email='instructor@test.com',
            password='password123'
        )
        self.instructor_user.profile.role = 'instructor'
        self.instructor_user.profile.save()

        self.student_user = User.objects.create_user(
            username='student',
            email='student@test.com',
            password='password123'
        )

    def test_login_returns_role_data(self):
        """Test login API returns user data with role"""
        response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'password123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['profile']['role'], 'admin')
