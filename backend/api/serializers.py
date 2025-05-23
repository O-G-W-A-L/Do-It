import uuid
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    EmailVerification,
    Task, Project, Routine, Goal,
    FileAttachment, Notification, Subtask,
    Profile,
)

# REGISTRATION & EMAIL VERIFICATION
class RegisterSerializer(serializers.ModelSerializer):
    email     = serializers.EmailField(required=True)
    password1 = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ('username', 'email', 'password1', 'password2')

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError({'password2': "Passwords must match."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({'email': "Email already in use."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username  = validated_data['username'],
            email     = validated_data['email'],
            password  = validated_data['password1'],
            is_active = False
        )
        ev = EmailVerification.objects.create(user=user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{ev.token}/"
        send_mail(
            subject        = 'Verify your email',
            message        = f'Click here to verify your account: {verify_url}',
            from_email     = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [user.email],
            fail_silently  = False,
        )
        return user

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            ev = EmailVerification.objects.get(token=value)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
        if not ev.is_valid():
            raise serializers.ValidationError("Token expired or already used.")
        return ev

    def save(self):
        ev = self.validated_data['token']
        ev.used = True
        ev.save(update_fields=['used'])
        user = ev.user
        user.is_active = True
        user.save(update_fields=['is_active'])
        return user

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account with this email.")
        if user.is_active:
            raise serializers.ValidationError("Account already verified.")
        return user

    def save(self):
        user = self.validated_data['email']
        EmailVerification.objects.filter(user=user, used=False).update(used=True)
        ev = EmailVerification.objects.create(user=user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{ev.token}/"
        send_mail(
            subject        = 'Resend verification',
            message        = f'Click here to verify your account: {verify_url}',
            from_email     = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [user.email],
            fail_silently  = False,
        )
        return ev

# PASSWORD RESET FLOW 
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("No active account with this email.")
        return user

    def save(self):
        user = self.validated_data['email']
        ev = EmailVerification.objects.create(user=user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{ev.token}/"
        send_mail(
            subject        = 'Password reset requested',
            message        = f'Click here to reset your password: {reset_url}',
            from_email     = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [user.email],
            fail_silently  = False,
        )
        return ev


class PasswordResetConfirmSerializer(serializers.Serializer):
    token        = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            ev = EmailVerification.objects.get(token=attrs['token'])
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")
        if not ev.is_valid():
            raise serializers.ValidationError("Token expired or already used.")
        attrs['ev'] = ev
        return attrs

    def save(self):
        ev = self.validated_data['ev']
        user = ev.user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        ev.used = True
        ev.save(update_fields=['used'])
        return user

# JWT & USER SERIALIZER
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        return token

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('profile_image', 'phone_number')

class UserSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(source='profile.profile_image', read_only=True)
    phone_number  = serializers.CharField(source='profile.phone_number', read_only=True)

    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'profile_image', 'phone_number')

# SUBTASK SERIALIZER
class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Subtask
        fields = ('id', 'title', 'is_done')


# TASK & RELATED SERIALIZERS
class TaskSerializer(serializers.ModelSerializer):
    user     = serializers.HiddenField(default=serializers.CurrentUserDefault())
    subtasks = SubtaskSerializer(many=True, required=False)

    class Meta:
        model            = Task
        fields           = (
            'id', 'user', 'title', 'description',
            'due_date', 'type',
            'priority', 'routine', 'goal',
            'focus_block', 'is_done',
            'subtasks',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        subtasks_data = validated_data.pop('subtasks', [])
        task = super().create(validated_data)
        for st in subtasks_data:
            Subtask.objects.create(task=task, **st)
        return task

    def update(self, instance, validated_data):
        subtasks_data = validated_data.pop('subtasks', None)
        task = super().update(instance, validated_data)
        if subtasks_data is not None:
            instance.subtasks.all().delete()
            for st in subtasks_data:
                Subtask.objects.create(task=task, **st)
        return task


# PROJECT
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Project
        fields = '__all__'

# Routine
class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Routine
        fields = '__all__'

# Goal
class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Goal
        fields = '__all__'

# FileAttachment
class FileAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FileAttachment
        fields = '__all__'

# Notification
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = '__all__'
