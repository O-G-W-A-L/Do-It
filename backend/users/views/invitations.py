from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import AdminInvitation
from ..serializers import UserSerializer


## Admin Invitation System (Magic Links)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_admin_invitation(request):
    """
    Send admin/instructor invitation email (admin only)
    """
    if not request.user.profile.is_admin:
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    email = request.data.get('email')
    role = request.data.get('role', 'instructor')

    if not email:
        return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    if role not in ['instructor', 'admin']:
        return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if invitation already exists and is valid
    existing_invitation = AdminInvitation.objects.filter(
        email=email,
        used=False,
        expires__gt=timezone.now()
    ).first()

    if existing_invitation:
        return Response({'detail': 'Invitation already sent to this email'}, status=status.HTTP_400_BAD_REQUEST)

    # Create invitation
    invitation = AdminInvitation.objects.create(
        email=email,
        role=role,
        invited_by=request.user
    )

    # Send invitation email
    try:
        invitation_url = f"{settings.FRONTEND_URL}/accept-invitation/{invitation.token}"
        subject = f"You're invited to join Do-It as {role.title()}"
        message = render_to_string('emails/admin_invitation.html', {
            'invitation': invitation,
            'invitation_url': invitation_url,
            'role': role.title(),
            'invited_by': request.user.get_full_name() or request.user.username
        })

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=message
        )

        return Response({
            'detail': f'Invitation sent to {email}',
            'invitation_id': invitation.id
        })

    except Exception as e:
        invitation.delete()  # Clean up on failure
        return Response({'detail': 'Failed to send invitation'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def accept_admin_invitation(request, token):
    """
    Accept admin invitation and create account (magic link)
    """
    try:
        invitation = AdminInvitation.objects.get(token=token)
    except AdminInvitation.DoesNotExist:
        return Response({'detail': 'Invalid invitation'}, status=status.HTTP_400_BAD_REQUEST)

    if not invitation.is_valid():
        return Response({'detail': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user already exists
    from django.contrib.auth import get_user_model
    User = get_user_model()

    try:
        user = User.objects.get(email=invitation.email)
        # User exists, just update their role
        invitation.accept(user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'detail': f'Welcome back! Your role has been updated to {invitation.role}',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'redirect': '/admin' if invitation.role in ['admin', 'instructor'] else '/dashboard'
        })
    except User.DoesNotExist:
        # Create new user account
        username = invitation.email.split('@')[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Create user with temporary password (they can change it later)
        temp_password = User.objects.make_random_password()
        user = User.objects.create_user(
            username=username,
            email=invitation.email,
            password=temp_password,
            first_name='',
            last_name='',
            is_active=True
        )

        # Accept invitation (sets role)
        invitation.accept(user)

        # Auto-login the user
        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': f'Account created! Welcome to Do-It as {invitation.role}',
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'redirect': '/admin' if invitation.role in ['admin', 'instructor'] else '/dashboard'
        })